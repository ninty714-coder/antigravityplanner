// Relie le store local (Dexie / zustand) au backend : restaure les données à
// la connexion, pousse automatiquement chaque changement (debounce), et
// résout les conflits simples entre appareils via un numéro de version.
import { db } from '../db';
import { usePlannerStore } from '../store/plannerStore';
import { api, ApiError } from './api';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;
let currentVersion = 0;
let applyingRemote = false;
let pushInFlight = false;
let pendingPushRequested = false;

async function readLocalSnapshot() {
  const [categories, tasks, events, habits] = await Promise.all([
    db.categories.toArray(),
    db.tasks.toArray(),
    db.events.toArray(),
    db.habits.toArray(),
  ]);
  return { categories, tasks, events, habits, settings: {} };
}

async function overwriteLocal(data: {
  categories?: any[];
  tasks?: any[];
  events?: any[];
  habits?: any[];
}) {
  applyingRemote = true;
  try {
    await db.transaction('rw', db.categories, db.tasks, db.events, db.habits, async () => {
      await db.categories.clear();
      await db.tasks.clear();
      await db.events.clear();
      await db.habits.clear();
      if (data.categories?.length) await db.categories.bulkAdd(data.categories);
      if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
      if (data.events?.length) await db.events.bulkAdd(data.events);
      if (data.habits?.length) await db.habits.bulkAdd(data.habits);
    });
    usePlannerStore.setState({
      categories: data.categories || [],
      tasks: data.tasks || [],
      events: data.events || [],
      habits: data.habits || [],
      loading: false,
    });
  } finally {
    // Laisse le temps au `set` ci-dessus de déclencher (et d'ignorer) une
    // notification de souscription avant de réautoriser les push locaux.
    setTimeout(() => {
      applyingRemote = false;
    }, 50);
  }
}

export async function pushToServer(): Promise<void> {
  if (pushInFlight) {
    pendingPushRequested = true;
    return;
  }
  pushInFlight = true;
  try {
    const data = await readLocalSnapshot();
    const res = await api.put('/api/sync', { version: currentVersion, data });
    currentVersion = res.version;
  } catch (err) {
    if (err instanceof ApiError && err.status === 409 && err.payload) {
      // Un autre appareil a synchronisé plus récemment : on adopte sa version
      // plutôt que d'écraser silencieusement des données plus fraîches.
      currentVersion = err.payload.version;
      await overwriteLocal(err.payload.data);
    } else {
      console.error('Sync push failed:', err);
    }
  } finally {
    pushInFlight = false;
    if (pendingPushRequested) {
      pendingPushRequested = false;
      await pushToServer();
    }
  }
}

export async function pullFromServer(): Promise<void> {
  try {
    const res = await api.get('/api/sync');
    currentVersion = res.version || 0;
    if (currentVersion > 0) {
      await overwriteLocal(res.data);
    } else {
      // Première connexion de ce compte : aucune donnée côté serveur pour
      // l'instant. On conserve l'état local (ou les données d'exemple créées
      // par init()) et on les pousse comme première sauvegarde.
      await pushToServer();
    }
  } catch (err) {
    console.error('Sync pull failed:', err);
  }
}

function scheduleDebouncedPush() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void pushToServer();
  }, 1200);
}

// Démarre la synchronisation automatique pour la session en cours : à
// appeler une fois l'utilisateur authentifié et les données locales chargées.
export function startSync() {
  if (unsubscribe) return;

  unsubscribe = usePlannerStore.subscribe((state, prevState) => {
    if (applyingRemote) return;
    const changed =
      state.categories !== prevState.categories ||
      state.tasks !== prevState.tasks ||
      state.events !== prevState.events ||
      state.habits !== prevState.habits;
    if (changed) scheduleDebouncedPush();
  });

  void pullFromServer();
}

// Arrête la synchronisation (déconnexion) : évite qu'un push différé ne
// parte après que l'utilisateur s'est déconnecté, et remet à zéro l'état de
// version pour la prochaine session (potentiellement un autre utilisateur).
export function stopSync() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  currentVersion = 0;
  pendingPushRequested = false;
}

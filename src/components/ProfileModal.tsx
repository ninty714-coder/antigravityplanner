import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useUIStore } from '../store/uiStore';
import { useAuthStore, authErrorMessage } from '../store/authStore';
import { PasswordField } from '../features/auth/PasswordField';
import { isPasswordValid } from '../features/auth/validators';

type Tab = 'profile' | 'password' | 'danger';

export const ProfileModal: React.FC = () => {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === 'profile';
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuthStore();

  const [tab, setTab] = useState<Tab>('profile');

  // --- Onglet Profil ---
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const AVATAR_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f43f5e', '#0ea5e9'];

  const saveProfile = async () => {
    setProfileErr(null);
    setProfileMsg(null);
    if (!name.trim()) {
      setProfileErr('Le nom ne peut pas être vide.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim() });
      setProfileMsg('Profil mis à jour.');
    } catch (err) {
      setProfileErr(authErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const changeAvatarColor = async (color: string) => {
    try {
      await updateProfile({ avatarColor: color });
    } catch {
      // silencieux : simple préférence visuelle, pas bloquant
    }
  };

  // --- Onglet Mot de passe ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const submitPasswordChange = async () => {
    setPwErr(null);
    if (!currentPassword) {
      setPwErr('Merci de renseigner votre mot de passe actuel.');
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setPwErr('Le nouveau mot de passe ne respecte pas les critères de sécurité.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwErr('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      closeModal();
      // Le serveur révoque toutes les sessions par sécurité : l'utilisateur est
      // ramené à l'écran de connexion via le changement de statut du authStore.
    } catch (err) {
      setPwErr(authErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  // --- Onglet Suppression de compte ---
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submitDelete = async () => {
    setDeleteErr(null);
    if (!deletePassword) {
      setDeleteErr('Merci de renseigner votre mot de passe pour confirmer.');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      closeModal();
    } catch (err) {
      setDeleteErr(authErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setTab('profile');
    setProfileMsg(null);
    setProfileErr(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPwErr(null);
    setDeletePassword('');
    setConfirmDelete(false);
    setDeleteErr(null);
    closeModal();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mon compte" size="md">
      <div className="flex flex-col gap-5">
        {/* Onglets */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          {[
            { key: 'profile' as Tab, label: 'Profil', icon: 'User' },
            { key: 'password' as Tab, label: 'Mot de passe', icon: 'KeyRound' },
            { key: 'danger' as Tab, label: 'Compte', icon: 'AlertTriangle' },
          ].map((t) => {
            const TabIcon = (Icons as any)[t.icon];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'profile' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.trim().charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Couleur d'avatar
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => changeAvatarColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        user.avatarColor === color ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Choisir la couleur ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Adresse e-mail" value={user.email} disabled />

            {profileErr && <p className="text-sm text-rose-500 dark:text-rose-400">{profileErr}</p>}
            {profileMsg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{profileMsg}</p>}

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { void logout(); }} type="button">
                <Icons.LogOut className="w-4 h-4 mr-1.5" />
                Déconnexion
              </Button>
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        )}

        {tab === 'password' && (
          <div className="flex flex-col gap-4">
            <PasswordField
              label="Mot de passe actuel"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordField
              label="Nouveau mot de passe"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordField
              label="Confirmer le nouveau mot de passe"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />

            {pwErr && <p className="text-sm text-rose-500 dark:text-rose-400">{pwErr}</p>}

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Après ce changement, toutes vos sessions actives (y compris sur d'autres appareils) seront déconnectées par sécurité.
            </p>

            <div className="flex justify-end">
              <Button onClick={submitPasswordChange} disabled={savingPw}>
                {savingPw ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
            </div>
          </div>
        )}

        {tab === 'danger' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                <Icons.AlertTriangle className="w-4 h-4" />
                Suppression définitive du compte
              </div>
              <p className="text-xs text-rose-600/90 dark:text-rose-400/80 leading-relaxed">
                Cette action est irréversible. Toutes vos données (tâches, événements, habitudes, objectifs, réglages) seront supprimées définitivement.
              </p>
            </div>

            <PasswordField
              label="Confirmez avec votre mot de passe"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              Je comprends que cette action est irréversible.
            </label>

            {deleteErr && <p className="text-sm text-rose-500 dark:text-rose-400">{deleteErr}</p>}

            <div className="flex justify-end">
              <Button variant="danger" onClick={submitDelete} disabled={!confirmDelete || deleting}>
                {deleting ? 'Suppression...' : 'Supprimer définitivement mon compte'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

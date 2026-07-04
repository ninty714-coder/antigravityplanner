import React, { useState, useEffect } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import type { RecurrenceType } from '../../types';
import { format, parseISO, addHours } from 'date-fns';

export const EventModal: React.FC = () => {
  const { categories, events, addEvent, updateEvent } = usePlannerStore();
  const { activeModal, selectedEventId, selectedEventDate, closeModal } = useUIStore();

  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // Recurrence & reminders
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [hasReminder, setHasReminder] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isOpen = activeModal === 'event';

  // Load event details if editing
  useEffect(() => {
    if (isOpen) {
      if (selectedEventId) {
        // Strip virtual recurrence suffixes
        const actualId = selectedEventId.split('_')[0];
        const event = events.find(e => e.id === actualId);
        if (event) {
          const start = parseISO(event.startTime);
          const end = parseISO(event.endTime);

          setTitle(event.title);
          setCatId(event.categoryId);
          setEventDate(format(start, 'yyyy-MM-dd'));
          setStartTime(format(start, 'HH:mm'));
          setEndTime(format(end, 'HH:mm'));
          setLocation(event.location || '');
          setNotes(event.notes || '');
          setRecurrenceType(event.recurrence?.type || 'none');
          setHasReminder(event.reminders && event.reminders.length > 0);
          
          // Use virtual completion state if editing specific virtual instance
          if (selectedEventId.includes('_')) {
            setIsCompleted(event.completed || false);
          } else {
            setIsCompleted(event.completed);
          }
        }
      } else {
        // Prefill states for creation
        setTitle('');
        setCatId(categories[0]?.id || 'cat-work');
        setLocation('');
        setNotes('');
        setRecurrenceType('none');
        setHasReminder(false);
        setIsCompleted(false);

        // Pre-fill time slots from selectedEventDate if provided
        if (selectedEventDate) {
          const prefillDate = parseISO(selectedEventDate);
          setEventDate(format(prefillDate, 'yyyy-MM-dd'));
          setStartTime(format(prefillDate, 'HH:mm'));
          
          // Default event duration: 1 hour
          const endPrefill = addHours(prefillDate, 1);
          setEndTime(format(endPrefill, 'HH:mm'));
        } else {
          const now = new Date();
          setEventDate(format(now, 'yyyy-MM-dd'));
          
          // Round to next half hour
          const start = new Date(now);
          start.setMinutes(start.getMinutes() + (30 - (start.getMinutes() % 30)));
          setStartTime(format(start, 'HH:mm'));
          
          const end = addHours(start, 1);
          setEndTime(format(end, 'HH:mm'));
        }
      }
    }
  }, [isOpen, selectedEventId, selectedEventDate, events, categories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || !startTime || !endTime) return;

    // Combine date + time strings into full ISO Strings
    const startISO = new Date(`${eventDate}T${startTime}:00`).toISOString();
    const endISO = new Date(`${eventDate}T${endTime}:00`).toISOString();

    const remindersPayload = hasReminder
      ? [{ id: 'rem-' + Math.random().toString(36).substring(2, 9), minutesBefore: 15, triggered: false }]
      : [];

    const eventPayload = {
      title: title.trim(),
      categoryId: catId,
      startTime: startISO,
      endTime: endISO,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      checklist: [],
      reminders: remindersPayload,
      recurrence: { type: recurrenceType },
      completed: isCompleted
    };

    if (selectedEventId) {
      const actualId = selectedEventId.split('_')[0];
      const existingEvent = events.find(e => e.id === actualId);
      if (existingEvent) {
        // If editing a virtual recurrence, update completion inside parent database row
        const isVirtual = selectedEventId.includes('_');
        if (isVirtual) {
          const dateSuffix = selectedEventId.split('_')[1];
          const completedDates: string[] = (existingEvent as any).completedDates || [];
          const index = completedDates.indexOf(dateSuffix);
          let updatedDates = [...completedDates];
          
          if (isCompleted) {
            if (index === -1) updatedDates.push(dateSuffix);
          } else {
            if (index > -1) updatedDates.splice(index, 1);
          }

          await updateEvent({
            ...existingEvent,
            completedDates: updatedDates as any
          });
        } else {
          await updateEvent({
            ...existingEvent,
            ...eventPayload
          });
        }
      }
    } else {
      await addEvent(eventPayload);
    }

    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={selectedEventId ? 'Modifier l\'Événement' : 'Créer un Événement'}
      size="md"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Titre de l'événement"
          placeholder="Ex: Réunion de synchronisation..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={selectedEventId?.includes('_') && selectedEventId !== null} // Disable main fields if completing virtual instance
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Catégorie"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            disabled={selectedEventId?.includes('_') && selectedEventId !== null}
          />

          <Input
            label="Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            disabled={selectedEventId?.includes('_') && selectedEventId !== null}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Heure de début"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            disabled={selectedEventId?.includes('_') && selectedEventId !== null}
          />

          <Input
            label="Heure de fin"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            disabled={selectedEventId?.includes('_') && selectedEventId !== null}
          />
        </div>

        <Input
          label="Lieu"
          placeholder="Ex: Bureau, Zoom, Restaurant..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={selectedEventId?.includes('_') && selectedEventId !== null}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Notes / Description
          </label>
          <textarea
            placeholder="Détails supplémentaires, liens de réunion..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={selectedEventId?.includes('_') && selectedEventId !== null}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 text-slate-850 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-slate-350 transition-all min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50">
          <Select
            label="Récurrence"
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value as any)}
            options={[
              { value: 'none', label: 'Aucune' },
              { value: 'daily', label: 'Quotidienne' },
              { value: 'weekly', label: 'Hebdomadaire' },
              { value: 'monthly', label: 'Mensuelle' }
            ]}
            disabled={selectedEventId?.includes('_') && selectedEventId !== null}
          />

          <div className="flex flex-col justify-center">
            <Switch
              label="Rappel (15 min)"
              checked={hasReminder}
              onChange={setHasReminder}
            />
          </div>
        </div>

        {selectedEventId && (
          <div className="py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 mt-1">
            <Switch
              label="Marquer comme complété"
              checked={isCompleted}
              onChange={setIsCompleted}
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-2.5 mt-2 rounded-xl text-sm"
        >
          {selectedEventId ? 'Enregistrer les modifications' : 'Créer l\'événement'}
        </Button>
      </form>
    </Modal>
  );
};

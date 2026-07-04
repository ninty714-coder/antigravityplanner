import { useCallback } from 'react';

export const useNotification = () => {
  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          icon: '/icon-192.png',
          ...options,
        });
      } catch (e) {
        // Fallback for some mobile browsers that don't support new Notification directly
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options);
          });
        }
      }
    }
  }, []);

  return { requestPermission, showNotification };
};

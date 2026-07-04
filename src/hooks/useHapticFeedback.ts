export const useHapticFeedback = () => {
  const triggerLight = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const triggerMedium = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  const triggerSuccess = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
  };

  return { triggerLight, triggerMedium, triggerSuccess };
};

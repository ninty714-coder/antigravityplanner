// src/lib/utils.ts

/**
 * Combines multiple class names filter out falsy values
 */
export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]): string {
  const classes: string[] = [];
  
  inputs.forEach(input => {
    if (!input) return;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          classes.push(key);
        }
      });
    }
  });
  
  return classes.join(' ');
}

/**
 * Converts a hex color string to an RGBA color string with the specified opacity
 */
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.trim().replace('#', '');
  
  // Handle short hex codes (e.g. "FFF")
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // Fallback if hex parsing fails
  if (cleanHex.length !== 6) {
    return hex;
  }
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Check if a hex color is light or dark
 * (used to determine whether text overlay should be dark or white)
 */
export function isLightColor(hex: string): boolean {
  let cleanHex = hex.trim().replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length !== 6) return true;
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // HSP color model equation
  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );
  
  return hsp > 127.5;
}

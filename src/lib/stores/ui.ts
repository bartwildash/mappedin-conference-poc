import { writable } from 'svelte/store';

export const searchOpen = writable<boolean>(false);
export const directionsOpen = writable<boolean>(false);
export const exhibitorCardOpen = writable<boolean>(false);
export const locationCardOpen = writable<boolean>(false);
export const floorSelectorOpen = writable<boolean>(false);

export const selectedLocation = writable<any>(null);

// Directions selection mode
export const selectingFromLocation = writable<boolean>(false);
export const selectingToLocation = writable<boolean>(false);

export const statusMessage = writable<string>('');
export const statusType = writable<'info' | 'success' | 'error' | 'warning'>('info');

export function showStatus(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', duration = 3000) {
  statusMessage.set(message);
  statusType.set(type);

  if (duration > 0) {
    setTimeout(() => {
      statusMessage.set('');
    }, duration);
  }
}

export function hideStatus() {
  statusMessage.set('');
}

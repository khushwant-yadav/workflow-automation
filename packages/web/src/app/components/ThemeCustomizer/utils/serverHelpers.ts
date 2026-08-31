// utils/getMode.ts

import { Mode, ModeSettings } from '../settingsContext';

// Get the current mode from localStorage
export const getMode = (): Mode => {
  try {
    const value =
      typeof window !== 'undefined'
        ? localStorage.getItem('shivam-theme-settings')
        : null;

    if (!value) return 'light';

    try {
      const parsedSettings = JSON.parse(value) as ModeSettings;
      return parsedSettings.mode || 'light';
    } catch {
      return 'light';
    }
  } catch {
    return 'light';
  }
};

// Get the full settings object from storage
export const getSettingsFromCookie = (): ModeSettings => {
  try {
    const value =
      typeof window !== 'undefined'
        ? localStorage.getItem('shivam-theme-settings')
        : null;

    if (!value) {
      return { mode: 'light' };
    }

    try {
      return JSON.parse(value) as ModeSettings;
    } catch {
      return { mode: 'light' };
    }
  } catch {
    return { mode: 'light' };
  }
};

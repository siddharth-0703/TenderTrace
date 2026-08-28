import type { AppSettings } from '../types/settings';
import { DEFAULT_APP_SETTINGS } from '../types/settings';

const SETTINGS_STORAGE_KEY = 'tendertrace_app_settings_v2';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APP_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    // Deep merge with defaults to safeguard against missing keys if schema evolves
    return {
      version: parsed.version || DEFAULT_APP_SETTINGS.version,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      general: {
        organization: { ...DEFAULT_APP_SETTINGS.general.organization, ...(parsed.general?.organization || {}) },
        notifications: { ...DEFAULT_APP_SETTINGS.general.notifications, ...(parsed.general?.notifications || {}) },
        system: { ...DEFAULT_APP_SETTINGS.general.system, ...(parsed.general?.system || {}) },
      },
      compliance: {
        thresholds: { ...DEFAULT_APP_SETTINGS.compliance.thresholds, ...(parsed.compliance?.thresholds || {}) },
        requiredDocuments: parsed.compliance?.requiredDocuments && Array.isArray(parsed.compliance.requiredDocuments)
          ? parsed.compliance.requiredDocuments
          : DEFAULT_APP_SETTINGS.compliance.requiredDocuments,
        verification: { ...DEFAULT_APP_SETTINGS.compliance.verification, ...(parsed.compliance?.verification || {}) },
        configuration: { ...DEFAULT_APP_SETTINGS.compliance.configuration, ...(parsed.compliance?.configuration || {}) },
      },
      fraudDetection: {
        riskThresholds: { ...DEFAULT_APP_SETTINGS.fraudDetection.riskThresholds, ...(parsed.fraudDetection?.riskThresholds || {}) },
        sensitivity: { ...DEFAULT_APP_SETTINGS.fraudDetection.sensitivity, ...(parsed.fraudDetection?.sensitivity || {}) },
        indicators: parsed.fraudDetection?.indicators && Array.isArray(parsed.fraudDetection.indicators)
          ? parsed.fraudDetection.indicators
          : DEFAULT_APP_SETTINGS.fraudDetection.indicators,
        investigationPriority: { ...DEFAULT_APP_SETTINGS.fraudDetection.investigationPriority, ...(parsed.fraudDetection?.investigationPriority || {}) },
      }
    };
  } catch (err) {
    console.error('Failed to load settings from storage, returning defaults:', err);
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    const payload: AppSettings = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('tendertrace:settings-changed', { detail: payload }));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
    throw new Error('Unable to persist settings to local storage.');
  }
}

export function resetSettingsToDefaults(): AppSettings {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    const defaults = { ...DEFAULT_APP_SETTINGS, lastUpdated: new Date().toISOString() };
    saveSettings(defaults);
    return defaults;
  } catch (err) {
    console.error('Failed to reset settings:', err);
    return DEFAULT_APP_SETTINGS;
  }
}

export function exportSettingsAsJson(settings: AppSettings): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(settings, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `tendertrace-settings-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importSettingsFromJson(jsonString: string): AppSettings {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.general || !parsed.compliance || !parsed.fraudDetection) {
      throw new Error('Invalid TenderTrace settings format: Missing core root modules.');
    }
    const validatedSettings: AppSettings = {
      version: parsed.version || DEFAULT_APP_SETTINGS.version,
      lastUpdated: new Date().toISOString(),
      general: {
        organization: { ...DEFAULT_APP_SETTINGS.general.organization, ...(parsed.general?.organization || {}) },
        notifications: { ...DEFAULT_APP_SETTINGS.general.notifications, ...(parsed.general?.notifications || {}) },
        system: { ...DEFAULT_APP_SETTINGS.general.system, ...(parsed.general?.system || {}) },
      },
      compliance: {
        thresholds: { ...DEFAULT_APP_SETTINGS.compliance.thresholds, ...(parsed.compliance?.thresholds || {}) },
        requiredDocuments: Array.isArray(parsed.compliance?.requiredDocuments)
          ? parsed.compliance.requiredDocuments
          : DEFAULT_APP_SETTINGS.compliance.requiredDocuments,
        verification: { ...DEFAULT_APP_SETTINGS.compliance.verification, ...(parsed.compliance?.verification || {}) },
        configuration: { ...DEFAULT_APP_SETTINGS.compliance.configuration, ...(parsed.compliance?.configuration || {}) },
      },
      fraudDetection: {
        riskThresholds: { ...DEFAULT_APP_SETTINGS.fraudDetection.riskThresholds, ...(parsed.fraudDetection?.riskThresholds || {}) },
        sensitivity: { ...DEFAULT_APP_SETTINGS.fraudDetection.sensitivity, ...(parsed.fraudDetection?.sensitivity || {}) },
        indicators: Array.isArray(parsed.fraudDetection?.indicators)
          ? parsed.fraudDetection.indicators
          : DEFAULT_APP_SETTINGS.fraudDetection.indicators,
        investigationPriority: { ...DEFAULT_APP_SETTINGS.fraudDetection.investigationPriority, ...(parsed.fraudDetection?.investigationPriority || {}) },
      }
    };
    saveSettings(validatedSettings);
    return validatedSettings;
  } catch (err: any) {
    throw new Error(`Import failed: ${err.message || 'Malformed JSON file'}`);
  }
}

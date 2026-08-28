import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { AppSettings, GeneralSettings, ComplianceSettings, FraudDetectionSettings } from '../../types/settings';
import {
  loadSettings,
  saveSettings,
  resetSettingsToDefaults,
  exportSettingsAsJson,
  importSettingsFromJson
} from '../../services/settingsStorage';

import GeneralSettingsSection from './sections/GeneralSettingsSection';
import ComplianceSettingsSection from './sections/ComplianceSettingsSection';
import FraudDetectionSettingsSection from './sections/FraudDetectionSettingsSection';

type TabKey = 'general' | 'compliance' | 'fraudDetection';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(loadSettings());
  const [savedSettings, setSavedSettings] = useState<AppSettings>(loadSettings());
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isDifferent = JSON.stringify(currentSettings) !== JSON.stringify(savedSettings);
    setIsDirty(isDifferent);
  }, [currentSettings, savedSettings]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSave = () => {
    try {
      saveSettings(currentSettings);
      setSavedSettings(currentSettings);
      setIsDirty(false);
      showToast('Settings saved successfully and applied across evaluation pipelines.');
    } catch (err: any) {
      showToast(`Error saving settings: ${err.message}`, 'error');
    }
  };

  const handleDiscard = () => {
    setCurrentSettings(savedSettings);
    setIsDirty(false);
    showToast('Unsaved changes discarded.', 'success');
  };

  const handleResetAll = () => {
    const fresh = resetSettingsToDefaults();
    setCurrentSettings(fresh);
    setSavedSettings(fresh);
    setIsDirty(false);
    showToast('All settings reset to standard GeM procurement defaults.');
  };

  const handleExport = () => {
    exportSettingsAsJson(currentSettings);
    showToast('Configuration exported as JSON.');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importSettingsFromJson(text);
        setCurrentSettings(imported);
        setSavedSettings(imported);
        setIsDirty(false);
        showToast('Settings imported and applied successfully.');
      } catch (err: any) {
        showToast(err.message || 'Failed to import JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateGeneral = (updated: GeneralSettings) => {
    setCurrentSettings(prev => ({ ...prev, general: updated }));
  };

  const updateCompliance = (updated: ComplianceSettings) => {
    setCurrentSettings(prev => ({ ...prev, compliance: updated }));
  };

  const updateFraudDetection = (updated: FraudDetectionSettings) => {
    setCurrentSettings(prev => ({ ...prev, fraudDetection: updated }));
  };

  return (
    <div className="settings-container">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1>Settings &amp; Rule Engine</h1>
              <span className="badge badge--info">v{currentSettings.version}</span>
            </div>
            <div className="subtitle">
              Manage organization preferences, compliance thresholds, required document rules, and fraud detector sensitivity
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json,application/json"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleImportClick}
              title="Import policy from JSON"
            >
              <Upload size={14} />
              Import JSON
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleExport}
              title="Export policy backup"
            >
              <Download size={14} />
              Export JSON
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleSave}
              disabled={!isDirty}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast Notification Banner ── */}
      {toast && (
        <div className={`toast-message toast-message--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="settings-tabs">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Sliders size={16} />
          General
          <span className="settings-tab-badge">3</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <ShieldCheck size={16} />
          Compliance
          <span className="settings-tab-badge">4</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'fraudDetection' ? 'active' : ''}`}
          onClick={() => setActiveTab('fraudDetection')}
        >
          <ShieldAlert size={16} />
          Fraud Detection
          <span className="settings-tab-badge">5</span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'general' && (
        <GeneralSettingsSection
          data={currentSettings.general}
          onChange={updateGeneral}
        />
      )}

      {activeTab === 'compliance' && (
        <ComplianceSettingsSection
          data={currentSettings.compliance}
          onChange={updateCompliance}
        />
      )}

      {activeTab === 'fraudDetection' && (
        <FraudDetectionSettingsSection
          data={currentSettings.fraudDetection}
          onChange={updateFraudDetection}
          onResetDefaults={handleResetAll}
        />
      )}

      {/* ── Sticky Action Bar (visible when changes are pending) ── */}
      {isDirty && (
        <div className="settings-sticky-footer">
          <div className="settings-dirty-badge">
            <SettingsIcon size={14} className="spinner" />
            You have unsaved changes in your rule configuration
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleDiscard}
            >
              Discard Changes
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
            >
              <Save size={16} />
              Save &amp; Apply Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

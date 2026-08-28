import React from 'react';
import { Building2, Bell, Sliders } from 'lucide-react';
import type { GeneralSettings } from '../../../types/settings';

interface Props {
  data: GeneralSettings;
  onChange: (updated: GeneralSettings) => void;
}

export default function GeneralSettingsSection({ data, onChange }: Props) {
  const updateOrg = (field: keyof GeneralSettings['organization'], value: any) => {
    onChange({
      ...data,
      organization: {
        ...data.organization,
        [field]: value
      }
    });
  };

  const updateNotif = (field: keyof GeneralSettings['notifications'], value: any) => {
    onChange({
      ...data,
      notifications: {
        ...data.notifications,
        [field]: value
      }
    });
  };

  const updateSystem = (field: keyof GeneralSettings['system'], value: any) => {
    onChange({
      ...data,
      system: {
        ...data.system,
        [field]: value
      }
    });
  };

  const handleRecipientsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
    updateNotif('recipients', lines);
  };

  return (
    <div className="settings-section">
      {/* ── Sub-nav anchors / quick jump ── */}
      <div className="settings-subnav">
        <a href="#org-preferences" className="settings-subnav-pill">Organization / Tender Preferences</a>
        <a href="#notifications" className="settings-subnav-pill">Notifications</a>
        <a href="#system-preferences" className="settings-subnav-pill">System Preferences</a>
      </div>

      {/* ── 1. Organization & Tender Preferences ── */}
      <div className="settings-card" id="org-preferences">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <Building2 size={18} className="text-navy" />
              Organization / Tender Preferences
            </div>
            <div className="settings-card__subtitle">
              Public procurement identity, portal identifiers, and standard tendering lifecycle defaults
            </div>
          </div>
          <span className="badge badge--info">GeM Node Active</span>
        </div>

        <div className="settings-card__body">
          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="orgName">
                Organization / Ministry Name
              </label>
              <input
                id="orgName"
                type="text"
                className="input"
                value={data.organization.organizationName}
                onChange={e => updateOrg('organizationName', e.target.value)}
                placeholder="e.g. Ministry of Electronics and IT"
              />
              <span className="form-hint">Official procuring authority name printed on analysis reports.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="deptCode">
                Department / Division Code
              </label>
              <input
                id="deptCode"
                type="text"
                className="input"
                value={data.organization.departmentCode}
                onChange={e => updateOrg('departmentCode', e.target.value)}
                placeholder="e.g. GEM-PROC-2026-MEITY"
              />
              <span className="form-hint">Unique procurement nodal reference code.</span>
            </div>
          </div>

          <div className="settings-grid-3">
            <div className="form-field">
              <label className="form-label" htmlFor="portalId">
                GeM Portal Integration ID
              </label>
              <input
                id="portalId"
                type="text"
                className="input"
                value={data.organization.tenderPortalId}
                onChange={e => updateOrg('tenderPortalId', e.target.value)}
              />
              <span className="form-hint">Endpoint identifier for tender feeds.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="currency">
                Tender Base Currency
              </label>
              <select
                id="currency"
                className="select"
                value={data.organization.currency}
                onChange={e => {
                  const curr = e.target.value;
                  const sym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : '€';
                  onChange({
                    ...data,
                    organization: {
                      ...data.organization,
                      currency: curr,
                      currencySymbol: sym
                    }
                  });
                }}
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
              <span className="form-hint">Standard valuation currency for financial bids.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="timezone">
                Timezone
              </label>
              <select
                id="timezone"
                className="select"
                value={data.organization.timezone}
                onChange={e => updateOrg('timezone', e.target.value)}
              >
                <option value="Asia/Kolkata (IST +05:30)">Asia/Kolkata (IST +05:30)</option>
                <option value="UTC (UTC +00:00)">UTC (UTC +00:00)</option>
                <option value="Asia/Dubai (GST +04:00)">Asia/Dubai (GST +04:00)</option>
              </select>
              <span className="form-hint">Timestamp synchronization for bid receipt logs.</span>
            </div>
          </div>

          <div className="settings-grid-3">
            <div className="form-field">
              <label className="form-label" htmlFor="validityDays">
                Default Tender Validity Period
                <span className="form-helper-val">{data.organization.defaultTenderValidityDays} Days</span>
              </label>
              <input
                id="validityDays"
                type="number"
                min={30}
                max={365}
                className="input"
                value={data.organization.defaultTenderValidityDays}
                onChange={e => updateOrg('defaultTenderValidityDays', Number(e.target.value) || 90)}
              />
              <span className="form-hint">Bid offer commitment duration from opening date.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="graceMins">
                Bid Submission Grace Window
                <span className="form-helper-val">{data.organization.bidSubmissionGraceMinutes} Mins</span>
              </label>
              <input
                id="graceMins"
                type="number"
                min={0}
                max={60}
                className="input"
                value={data.organization.bidSubmissionGraceMinutes}
                onChange={e => updateOrg('bidSubmissionGraceMinutes', Number(e.target.value) || 0)}
              />
              <span className="form-hint">Permissible clock skew buffer for network latency.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="contactEmail">
                Public Procurement Contact
              </label>
              <input
                id="contactEmail"
                type="email"
                className="input"
                value={data.organization.publicContactEmail}
                onChange={e => updateOrg('publicContactEmail', e.target.value)}
                placeholder="procurement@dept.gov.in"
              />
              <span className="form-hint">Contact displayed for vendor clarifications.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Notifications ── */}
      <div className="settings-card" id="notifications">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <Bell size={18} className="text-navy" />
              Notifications &amp; Vigilance Alerts
            </div>
            <div className="settings-card__subtitle">
              Configure real-time trigger thresholds and notification channels for anomalies
            </div>
          </div>
        </div>

        <div className="settings-card__body">
          <div className="settings-grid-2">
            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Email Notifications Dispatch</div>
                <div className="toggle-desc">Send automated emails for high-priority evaluation events.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.notifications.emailNotificationsEnabled}
                  onChange={e => updateNotif('emailNotificationsEnabled', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Critical Risk Instant Alert</div>
                <div className="toggle-desc">Immediate push alert when fraud score exceeds Critical cutoff (&ge;75).</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.notifications.alertOnCriticalRisk}
                  onChange={e => updateNotif('alertOnCriticalRisk', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">High Risk Anomaly Warning</div>
                <div className="toggle-desc">Notify vigilance officers on High Risk bids (50-74 risk score).</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.notifications.alertOnHighRisk}
                  onChange={e => updateNotif('alertOnHighRisk', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Compliance Failure Alert</div>
                <div className="toggle-desc">Trigger notification when mandatory legal/statutory exhibits fail.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.notifications.alertOnComplianceFailure}
                  onChange={e => updateNotif('alertOnComplianceFailure', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="recipients">
                Alert Email Recipients
                <span className="form-hint">(One email per line)</span>
              </label>
              <textarea
                id="recipients"
                className="input"
                style={{ height: '90px', padding: '8px 12px', resize: 'vertical' }}
                value={data.notifications.recipients.join('\n')}
                onChange={handleRecipientsChange}
                placeholder="vigilance@gem.gov.in&#10;auditor@meity.gov.in"
              />
              <span className="form-hint">Procurement officers and vigilance cell members receiving alerts.</span>
            </div>

            <div className="form-field">
              <div className="toggle-row" style={{ marginBottom: '8px' }}>
                <div className="toggle-info">
                  <div className="toggle-title">Webhook Relay Integration</div>
                  <div className="toggle-desc">Post JSON anomaly payloads to internal SIEM / dashboard endpoint.</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={data.notifications.webhookEnabled}
                    onChange={e => updateNotif('webhookEnabled', e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
              <input
                type="url"
                className="input"
                disabled={!data.notifications.webhookEnabled}
                value={data.notifications.webhookUrl}
                onChange={e => updateNotif('webhookUrl', e.target.value)}
                placeholder="https://your-org.gov.in/api/webhooks/tender-alerts"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. System Preferences ── */}
      <div className="settings-card" id="system-preferences">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <Sliders size={18} className="text-navy" />
              System Preferences
            </div>
            <div className="settings-card__subtitle">
              Execution modes, audit logging verbosity, and data governance policies
            </div>
          </div>
        </div>

        <div className="settings-card__body">
          <div className="settings-grid-2">
            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Auto-Analyze on Bid Upload</div>
                <div className="toggle-desc">Automatically trigger compliance OCR and fraud correlation on submission.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.system.autoAnalyzeOnBidUpload}
                  onChange={e => updateSystem('autoAnalyzeOnBidUpload', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Allow Sandbox / Mock Datasets</div>
                <div className="toggle-desc">Enable synthetic anomaly bid injection for evaluation testing.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.system.allowDevMockData}
                  onChange={e => updateSystem('allowDevMockData', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-grid-3">
            <div className="form-field">
              <label className="form-label" htmlFor="auditLog">
                Audit Logging Level
              </label>
              <select
                id="auditLog"
                className="select"
                value={data.system.auditLogLevel}
                onChange={e => updateSystem('auditLogLevel', e.target.value)}
              >
                <option value="MINIMAL">Minimal (Status changes only)</option>
                <option value="STANDARD">Standard (Analysis + Decision events)</option>
                <option value="VERBOSE">Verbose (Full forensic OCR trace &amp; scoring logs)</option>
              </select>
              <span className="form-hint">Stored in immutable forensic ledger.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="retention">
                Data Retention Period
                <span className="form-helper-val">{data.system.dataRetentionYears} Years</span>
              </label>
              <select
                id="retention"
                className="select"
                value={data.system.dataRetentionYears}
                onChange={e => updateSystem('dataRetentionYears', Number(e.target.value))}
              >
                <option value={1}>1 Year (Short-term)</option>
                <option value={3}>3 Years (Standard commercial audit)</option>
                <option value={5}>5 Years (Statutory public procurement)</option>
                <option value={10}>10 Years (Permanent defense &amp; infrastructure)</option>
              </select>
              <span className="form-hint">Document &amp; hash archive compliance duration.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="themeDensity">
                Interface Density
              </label>
              <select
                id="themeDensity"
                className="select"
                value={data.system.themeDensity}
                onChange={e => updateSystem('themeDensity', e.target.value)}
              >
                <option value="comfortable">Comfortable (Standard UI padding)</option>
                <option value="compact">Compact (High-density officer view)</option>
              </select>
              <span className="form-hint">Controls table row height and card spacing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

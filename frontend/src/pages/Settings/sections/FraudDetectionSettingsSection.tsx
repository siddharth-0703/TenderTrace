import { useState } from 'react';
import { ShieldAlert, Gauge, Activity, Clock, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FraudDetectionSettings, IndicatorConfigItem } from '../../../types/settings';

interface Props {
  data: FraudDetectionSettings;
  onChange: (updated: FraudDetectionSettings) => void;
  onResetDefaults: () => void;
}

export default function FraudDetectionSettingsSection({ data, onChange, onResetDefaults }: Props) {
  const [showResetModal, setShowResetModal] = useState(false);

  const updateRiskThresholds = (field: keyof FraudDetectionSettings['riskThresholds'], value: any) => {
    onChange({
      ...data,
      riskThresholds: {
        ...data.riskThresholds,
        [field]: value
      }
    });
  };

  const updateSensitivity = (field: keyof FraudDetectionSettings['sensitivity'], value: any) => {
    onChange({
      ...data,
      sensitivity: {
        ...data.sensitivity,
        [field]: value
      }
    });
  };

  const handleSensitivityPreset = (preset: 'CONSERVATIVE' | 'STANDARD' | 'AGGRESSIVE') => {
    if (preset === 'CONSERVATIVE') {
      onChange({
        ...data,
        sensitivity: {
          preset: 'CONSERVATIVE',
          textSimilarityThresholdPercent: 92,
          priceCollusionDeltaPercent: 0.2,
          sharedInfrastructureSensitivity: 'LOW',
          fuzzyMatchingTolerancePercent: 88
        }
      });
    } else if (preset === 'STANDARD') {
      onChange({
        ...data,
        sensitivity: {
          preset: 'STANDARD',
          textSimilarityThresholdPercent: 85,
          priceCollusionDeltaPercent: 0.5,
          sharedInfrastructureSensitivity: 'HIGH',
          fuzzyMatchingTolerancePercent: 80
        }
      });
    } else {
      onChange({
        ...data,
        sensitivity: {
          preset: 'AGGRESSIVE',
          textSimilarityThresholdPercent: 78,
          priceCollusionDeltaPercent: 1.0,
          sharedInfrastructureSensitivity: 'HIGH',
          fuzzyMatchingTolerancePercent: 70
        }
      });
    }
  };

  const handleUpdateIndicator = (index: number, field: keyof IndicatorConfigItem, value: any) => {
    const updated = [...data.indicators];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange({
      ...data,
      indicators: updated
    });
  };

  const updatePriority = (field: keyof FraudDetectionSettings['investigationPriority'], value: any) => {
    onChange({
      ...data,
      investigationPriority: {
        ...data.investigationPriority,
        [field]: value
      }
    });
  };

  const { criticalScoreCutoff, highScoreCutoff, mediumScoreCutoff } = data.riskThresholds;

  return (
    <div className="settings-section">
      {/* ── Sub-nav anchors ── */}
      <div className="settings-subnav">
        <a href="#risk-thresholds" className="settings-subnav-pill">Risk Thresholds</a>
        <a href="#detection-sensitivity" className="settings-subnav-pill">Detection Sensitivity</a>
        <a href="#indicator-configuration" className="settings-subnav-pill">Indicator Configuration</a>
        <a href="#investigation-priority" className="settings-subnav-pill">Investigation Priority</a>
        <a href="#reset-defaults" className="settings-subnav-pill">Reset to Defaults</a>
      </div>

      {/* ── 1. Risk Thresholds ── */}
      <div className="settings-card" id="risk-thresholds">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <ShieldAlert size={18} className="text-navy" />
              Risk Thresholds &amp; Score Classification Bands
            </div>
            <div className="settings-card__subtitle">
              Calibrate numerical risk score boundaries across Low, Medium, High, and Critical tiers
            </div>
          </div>
        </div>

        <div className="settings-card__body">
          {/* Live Risk Cutoff Visualizer */}
          <div className="form-field">
            <label className="form-label">Active Risk Score Range Map (0 - 100)</label>
            <div className="risk-cutoff-visualizer">
              <div
                className="risk-visual-band--low"
                style={{ width: `${Math.max(mediumScoreCutoff, 5)}%` }}
                title={`Low Risk: 0 - ${mediumScoreCutoff - 1}`}
              >
                LOW (0 - {mediumScoreCutoff - 1})
              </div>
              <div
                className="risk-visual-band--medium"
                style={{ width: `${Math.max(highScoreCutoff - mediumScoreCutoff, 5)}%` }}
                title={`Medium Risk: ${mediumScoreCutoff} - ${highScoreCutoff - 1}`}
              >
                MED ({mediumScoreCutoff} - {highScoreCutoff - 1})
              </div>
              <div
                className="risk-visual-band--high"
                style={{ width: `${Math.max(criticalScoreCutoff - highScoreCutoff, 5)}%` }}
                title={`High Risk: ${highScoreCutoff} - ${criticalScoreCutoff - 1}`}
              >
                HIGH ({highScoreCutoff} - {criticalScoreCutoff - 1})
              </div>
              <div
                className="risk-visual-band--critical"
                style={{ width: `${Math.max(100 - criticalScoreCutoff, 5)}%` }}
                title={`Critical Risk: ${criticalScoreCutoff} - 100`}
              >
                CRITICAL ({criticalScoreCutoff}+)
              </div>
            </div>
          </div>

          <div className="settings-grid-3">
            <div className="form-field">
              <label className="form-label" htmlFor="critCutoff">
                Critical Risk Cutoff (Score &ge;)
                <span className="badge badge--critical">{criticalScoreCutoff}</span>
              </label>
              <input
                id="critCutoff"
                type="range"
                min={60}
                max={90}
                className="range-slider"
                value={criticalScoreCutoff}
                onChange={e => updateRiskThresholds('criticalScoreCutoff', Number(e.target.value))}
              />
              <span className="form-hint">Triggers immediate bid freeze and P1 vigilance escalation.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="highCutoff">
                High Risk Cutoff (Score &ge;)
                <span className="badge badge--high">{highScoreCutoff}</span>
              </label>
              <input
                id="highCutoff"
                type="range"
                min={40}
                max={criticalScoreCutoff - 5}
                className="range-slider"
                value={highScoreCutoff}
                onChange={e => updateRiskThresholds('highScoreCutoff', Number(e.target.value))}
              />
              <span className="form-hint">Flags bid for mandatory forensic manual review.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="medCutoff">
                Medium Risk Cutoff (Score &ge;)
                <span className="badge badge--medium">{mediumScoreCutoff}</span>
              </label>
              <input
                id="medCutoff"
                type="range"
                min={15}
                max={highScoreCutoff - 5}
                className="range-slider"
                value={mediumScoreCutoff}
                onChange={e => updateRiskThresholds('mediumScoreCutoff', Number(e.target.value))}
              />
              <span className="form-hint">Advisory anomaly flags shown to evaluating officer.</span>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="autoFlagScore">
                Vigilance Officer Auto-Assignment Score Trigger
                <span className="form-helper-val">&ge; {data.riskThresholds.autoFlagVigilanceScore} Pts</span>
              </label>
              <input
                id="autoFlagScore"
                type="number"
                min={50}
                max={100}
                className="input"
                value={data.riskThresholds.autoFlagVigilanceScore}
                onChange={e => updateRiskThresholds('autoFlagVigilanceScore', Number(e.target.value) || 70)}
              />
              <span className="form-hint">Score at which the case is automatically queued for CVO scrutiny.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Detection Sensitivity ── */}
      <div className="settings-card" id="detection-sensitivity">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <Gauge size={18} className="text-navy" />
              Detection Sensitivity &amp; Correlation Parameters
            </div>
            <div className="settings-card__subtitle">
              Adjust NLP text similarity thresholds, price spread clustering bounds, and forensic tolerance
            </div>
          </div>
          <span className="badge badge--info">Mode: {data.sensitivity.preset}</span>
        </div>

        <div className="settings-card__body">
          {/* Preset Buttons */}
          <div className="form-field">
            <label className="form-label">Sensitivity Calibration Presets</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn--sm ${data.sensitivity.preset === 'CONSERVATIVE' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => handleSensitivityPreset('CONSERVATIVE')}
              >
                Conservative (Low False Positives)
              </button>
              <button
                type="button"
                className={`btn btn--sm ${data.sensitivity.preset === 'STANDARD' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => handleSensitivityPreset('STANDARD')}
              >
                Standard (Recommended for GeM)
              </button>
              <button
                type="button"
                className={`btn btn--sm ${data.sensitivity.preset === 'AGGRESSIVE' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => handleSensitivityPreset('AGGRESSIVE')}
              >
                Aggressive (Maximum Anomaly Catch)
              </button>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="range-slider-wrapper">
              <div className="range-slider-header">
                <label className="form-label" htmlFor="textSim">
                  Cross-Bid Text Cosine Similarity Flag Threshold
                </label>
                <span className="badge badge--info">{data.sensitivity.textSimilarityThresholdPercent}%</span>
              </div>
              <input
                id="textSim"
                type="range"
                min={60}
                max={98}
                className="range-slider"
                value={data.sensitivity.textSimilarityThresholdPercent}
                onChange={e => updateSensitivity('textSimilarityThresholdPercent', Number(e.target.value))}
              />
              <span className="form-hint">
                Flags potential collusion when semantic overlap between competing bids exceeds this value.
              </span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="priceDelta">
                Price Clustering / Margin Variance Threshold (%)
                <span className="form-helper-val">&le; {data.sensitivity.priceCollusionDeltaPercent}%</span>
              </label>
              <input
                id="priceDelta"
                type="number"
                min={0.1}
                max={5.0}
                step={0.1}
                className="input"
                value={data.sensitivity.priceCollusionDeltaPercent}
                onChange={e => updateSensitivity('priceCollusionDeltaPercent', Number(e.target.value) || 0.5)}
              />
              <span className="form-hint">Bids submitted within this narrow price delta are flagged for cover pricing.</span>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="infraSens">
                Shared Network / Metadata Infrastructure Sensitivity
              </label>
              <select
                id="infraSens"
                className="select"
                value={data.sensitivity.sharedInfrastructureSensitivity}
                onChange={e => updateSensitivity('sharedInfrastructureSensitivity', e.target.value)}
              >
                <option value="LOW">Low (Matches only on identical MAC + IP + Creator GUID)</option>
                <option value="MEDIUM">Medium (Matches on shared IP or identical creator software signature)</option>
                <option value="HIGH">High (Matches on shared subnets, phone, or timestamp proximity)</option>
              </select>
            </div>

            <div className="range-slider-wrapper">
              <div className="range-slider-header">
                <label className="form-label" htmlFor="fuzzyTol">
                  Entity Fuzzy Name Match Strictness
                </label>
                <span className="badge badge--neutral">{data.sensitivity.fuzzyMatchingTolerancePercent}%</span>
              </div>
              <input
                id="fuzzyTol"
                type="range"
                min={65}
                max={95}
                className="range-slider"
                value={data.sensitivity.fuzzyMatchingTolerancePercent}
                onChange={e => updateSensitivity('fuzzyMatchingTolerancePercent', Number(e.target.value))}
              />
              <span className="form-hint">Levenshtein distance ratio required to resolve legal trade name variations.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Indicator Configuration ── */}
      <div className="settings-card" id="indicator-configuration">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <Activity size={18} className="text-navy" />
              Indicator Configuration &amp; Penalty Point Weights
            </div>
            <div className="settings-card__subtitle">
              Enable/disable specific fraud detectors and calibrate their point contributions to overall risk
            </div>
          </div>
          <span className="badge badge--info">{data.indicators.filter(i => i.enabled).length} / {data.indicators.length} Active</span>
        </div>

        <div className="settings-card__body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Detector Indicator</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Base Severity</th>
                  <th>Penalty Points</th>
                </tr>
              </thead>
              <tbody>
                {data.indicators.map((ind, idx) => (
                  <tr key={ind.id} style={{ opacity: ind.enabled ? 1 : 0.6 }}>
                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{ind.label}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                        {ind.description}
                      </div>
                      <div className="rule-tag" style={{ marginTop: '4px', display: 'inline-block' }}>{ind.type}</div>
                    </td>
                    <td>
                      <span className="badge badge--neutral">{ind.category}</span>
                    </td>
                    <td>
                      <label className="switch" style={{ width: '38px', height: '20px' }}>
                        <input
                          type="checkbox"
                          checked={ind.enabled}
                          onChange={e => handleUpdateIndicator(idx, 'enabled', e.target.checked)}
                        />
                        <span className="switch-slider" style={{ borderRadius: '20px' }}></span>
                      </label>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ height: '30px', padding: '2px 8px', fontSize: 'var(--text-xs)', width: '110px' }}
                        value={ind.baseSeverity}
                        onChange={e => handleUpdateIndicator(idx, 'baseSeverity', e.target.value)}
                        disabled={!ind.enabled}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={5}
                          max={60}
                          className="input weight-input"
                          value={ind.penaltyPoints}
                          onChange={e => handleUpdateIndicator(idx, 'penaltyPoints', Number(e.target.value) || 0)}
                          disabled={!ind.enabled}
                        />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>Pts</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 4. Investigation Priority ── */}
      <div className="settings-card" id="investigation-priority">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <Clock size={18} className="text-navy" />
              Investigation Priority &amp; Vigilance SLAs
            </div>
            <div className="settings-card__subtitle">
              SLA resolution deadlines, auto-assignment rules, and automated bid suspension policies
            </div>
          </div>
        </div>

        <div className="settings-card__body">
          <div className="settings-grid-2">
            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Auto-Assign Vigilance on Critical Risk</div>
                <div className="toggle-desc">Automatically route case to Chief Vigilance Officer (CVO) workspace.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.investigationPriority.autoAssignVigilanceOnCritical}
                  onChange={e => updatePriority('autoAssignVigilanceOnCritical', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Auto-Freeze Bid Evaluation on Critical Risk</div>
                <div className="toggle-desc">Halt commercial bid opening until vigilance clearance is recorded.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.investigationPriority.autoFreezeBidOnCritical}
                  onChange={e => updatePriority('autoFreezeBidOnCritical', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="p1Sla">
                P1 Immediate Escalation SLA
                <span className="badge badge--critical">{data.investigationPriority.p1ImmediateSlaHours} Hours</span>
              </label>
              <input
                id="p1Sla"
                type="number"
                min={6}
                max={72}
                className="input"
                value={data.investigationPriority.p1ImmediateSlaHours}
                onChange={e => updatePriority('p1ImmediateSlaHours', Number(e.target.value) || 24)}
              />
              <span className="form-hint">Maximum permissible time for initial forensic triage on Critical bids.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="p2Sla">
                P2 High Priority SLA
                <span className="badge badge--high">{data.investigationPriority.p2HighSlaHours} Hours</span>
              </label>
              <input
                id="p2Sla"
                type="number"
                min={12}
                max={120}
                className="input"
                value={data.investigationPriority.p2HighSlaHours}
                onChange={e => updatePriority('p2HighSlaHours', Number(e.target.value) || 48)}
              />
              <span className="form-hint">Resolution target for High Risk / Cross-bid collusion flags.</span>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="p3Sla">
                P3 Medium Review SLA
                <span className="badge badge--medium">{data.investigationPriority.p3MediumSlaDays} Days</span>
              </label>
              <input
                id="p3Sla"
                type="number"
                min={1}
                max={30}
                className="input"
                value={data.investigationPriority.p3MediumSlaDays}
                onChange={e => updatePriority('p3MediumSlaDays', Number(e.target.value) || 5)}
              />
              <span className="form-hint">Target turnaround for standard anomaly clarifications.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="p4Sla">
                P4 Routine Audit SLA
                <span className="badge badge--neutral">{data.investigationPriority.p4RoutineSlaDays} Days</span>
              </label>
              <input
                id="p4Sla"
                type="number"
                min={5}
                max={60}
                className="input"
                value={data.investigationPriority.p4RoutineSlaDays}
                onChange={e => updatePriority('p4RoutineSlaDays', Number(e.target.value) || 14)}
              />
              <span className="form-hint">Post-award retrospective audit cycle.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Reset to Defaults ── */}
      <div className="settings-card" id="reset-defaults" style={{ borderLeft: '4px solid var(--color-warning)' }}>
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <RotateCcw size={18} className="text-navy" />
              Reset Fraud Detection &amp; Platform Parameters
            </div>
            <div className="settings-card__subtitle">
              Revert all risk thresholds, indicators, document rules, and weights to the standard GeM baseline
            </div>
          </div>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setShowResetModal(true)}
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
        </div>
        <div className="settings-card__body">
          <div className="alert alert--info">
            <div className="alert__icon">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="alert__title">Standard Smart India Hackathon &amp; GeM Baseline</div>
              <div>
                Default parameters conform to GeM 4.0 public procurement manuals and Ministry of Finance GFR 2017 rules.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reset Confirmation Modal ── */}
      {showResetModal && (
        <div className="settings-modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-modal__header">
              <div className="settings-card__title" style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={18} />
                Confirm Reset to Default Configuration
              </div>
            </div>
            <div className="settings-modal__body">
              <p style={{ marginBottom: '12px' }}>
                Are you sure you want to reset all <strong>Fraud Detection, Compliance, and General settings</strong> to their original baseline defaults?
              </p>
              <div className="alert alert--warning">
                <div>
                  Any custom risk weights, added document rules, or modified notification recipients will be overwritten with initial system defaults.
                </div>
              </div>
            </div>
            <div className="settings-modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  onResetDefaults();
                  setShowResetModal(false);
                }}
              >
                Yes, Reset All Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

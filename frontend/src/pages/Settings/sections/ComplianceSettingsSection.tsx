import React, { useState } from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, SlidersHorizontal, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { ComplianceSettings, RequiredDocumentRule } from '../../../types/settings';

interface Props {
  data: ComplianceSettings;
  onChange: (updated: ComplianceSettings) => void;
}

export default function ComplianceSettingsSection({ data, onChange }: Props) {
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<RequiredDocumentRule>>({
    name: '',
    code: '',
    category: 'TECHNICAL',
    isMandatory: true,
    minOcrConfidence: 80,
    validityBufferDays: 60,
    allowedFileTypes: ['pdf'],
    description: ''
  });

  const updateThresholds = (field: keyof ComplianceSettings['thresholds'], value: any) => {
    onChange({
      ...data,
      thresholds: {
        ...data.thresholds,
        [field]: value
      }
    });
  };

  const updateVerification = (field: keyof ComplianceSettings['verification'], value: any) => {
    onChange({
      ...data,
      verification: {
        ...data.verification,
        [field]: value
      }
    });
  };

  const updateConfig = (field: keyof ComplianceSettings['configuration'], value: any) => {
    onChange({
      ...data,
      configuration: {
        ...data.configuration,
        [field]: value
      }
    });
  };

  const handleUpdateDoc = (index: number, field: keyof RequiredDocumentRule, value: any) => {
    const updated = [...data.requiredDocuments];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange({
      ...data,
      requiredDocuments: updated
    });
  };

  const handleDeleteDoc = (id: string) => {
    onChange({
      ...data,
      requiredDocuments: data.requiredDocuments.filter(d => d.id !== id)
    });
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.code) return;

    const docToAdd: RequiredDocumentRule = {
      id: `doc-custom-${Date.now()}`,
      name: newDoc.name,
      code: newDoc.code.toUpperCase().replace(/\s+/g, '_'),
      category: newDoc.category || 'TECHNICAL',
      isMandatory: !!newDoc.isMandatory,
      minOcrConfidence: Number(newDoc.minOcrConfidence) || 75,
      validityBufferDays: Number(newDoc.validityBufferDays) || 30,
      allowedFileTypes: newDoc.allowedFileTypes || ['pdf'],
      description: newDoc.description || ''
    };

    onChange({
      ...data,
      requiredDocuments: [...data.requiredDocuments, docToAdd]
    });

    setNewDoc({
      name: '',
      code: '',
      category: 'TECHNICAL',
      isMandatory: true,
      minOcrConfidence: 80,
      validityBufferDays: 60,
      allowedFileTypes: ['pdf'],
      description: ''
    });
    setShowAddDocModal(false);
  };

  const totalPillarWeights =
    Number(data.configuration.eligibilityWeight) +
    Number(data.configuration.technicalWeight) +
    Number(data.configuration.financialWeight);

  return (
    <div className="settings-section">
      {/* ── Sub-nav anchors ── */}
      <div className="settings-subnav">
        <a href="#compliance-thresholds" className="settings-subnav-pill">Compliance Thresholds</a>
        <a href="#required-documents" className="settings-subnav-pill">Required Document Rules</a>
        <a href="#verification-preferences" className="settings-subnav-pill">Verification Preferences</a>
        <a href="#compliance-configuration" className="settings-subnav-pill">Compliance Configuration</a>
      </div>

      {/* ── 1. Compliance Thresholds ── */}
      <div className="settings-card" id="compliance-thresholds">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <ShieldCheck size={18} className="text-navy" />
              Compliance Thresholds &amp; Cutoffs
            </div>
            <div className="settings-card__subtitle">
              Configure minimum pass scores, financial deviation buffers, and debarment rejection criteria
            </div>
          </div>
        </div>

        <div className="settings-card__body">
          <div className="settings-grid-2">
            <div className="range-slider-wrapper">
              <div className="range-slider-header">
                <label className="form-label" htmlFor="minPassScore">
                  Minimum Overall Compliance Pass Score
                </label>
                <span className="badge badge--info">{data.thresholds.minOverallPassScore}%</span>
              </div>
              <input
                id="minPassScore"
                type="range"
                min={50}
                max={100}
                step={1}
                className="range-slider"
                value={data.thresholds.minOverallPassScore}
                onChange={e => updateThresholds('minOverallPassScore', Number(e.target.value))}
              />
              <span className="form-hint">
                Bids scoring below this aggregated compliance index are marked <strong>NON-COMPLIANT</strong>.
              </span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="turnoverTol">
                Financial Turnover Tolerance Buffer
                <span className="form-helper-val">{data.thresholds.financialTurnoverTolerancePercent}%</span>
              </label>
              <input
                id="turnoverTol"
                type="number"
                min={0}
                max={15}
                step={0.5}
                className="input"
                value={data.thresholds.financialTurnoverTolerancePercent}
                onChange={e => updateThresholds('financialTurnoverTolerancePercent', Number(e.target.value) || 0)}
              />
              <span className="form-hint">Permitted variance percentage for average annual turnover criteria.</span>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Zero Tolerance on Mandatory Exhibits</div>
                <div className="toggle-desc">Instantly fail bid if any mandatory document (GST, PAN, EMD) is missing or unverified.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.thresholds.zeroToleranceMandatory}
                  onChange={e => updateThresholds('zeroToleranceMandatory', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Debarred / Blacklisted Auto-Disqualification</div>
                <div className="toggle-desc">Automatically reject bids from vendors flagged on GeM/CPPP debarment registries.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.thresholds.blacklistedDebarmentAutoReject}
                  onChange={e => updateThresholds('blacklistedDebarmentAutoReject', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">MSME Exemption &amp; Preference</div>
                <div className="toggle-desc">Waive EMD and prior turnover requirements for verified Udyam certificate holders.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.thresholds.msmeExemptionEnabled}
                  onChange={e => updateThresholds('msmeExemptionEnabled', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">DPIIT Recognized Startup Exemption</div>
                <div className="toggle-desc">Relax prior experience criteria for certified DPIIT tech startups.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.thresholds.startupExemptionEnabled}
                  onChange={e => updateThresholds('startupExemptionEnabled', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Required Document Rules ── */}
      <div className="settings-card" id="required-documents">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <FileCheck size={18} className="text-navy" />
              Required Document Rules &amp; Extraction Criteria
            </div>
            <div className="settings-card__subtitle">
              Manage the master schedule of required tender exhibits, OCR thresholds, and validation rules
            </div>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setShowAddDocModal(true)}
          >
            <Plus size={14} />
            Add Document Rule
          </button>
        </div>

        <div className="settings-card__body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Document Name / Code</th>
                  <th>Category</th>
                  <th>Mandatory</th>
                  <th>Min OCR Confidence</th>
                  <th>Validity Buffer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.requiredDocuments.map((doc, idx) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{doc.name}</div>
                      <div className="rule-tag" style={{ marginTop: '2px', display: 'inline-block' }}>{doc.code}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        doc.category === 'STATUTORY' ? 'badge--info' :
                        doc.category === 'FINANCIAL' ? 'badge--medium' :
                        doc.category === 'LEGAL' ? 'badge--high' : 'badge--neutral'
                      }`}>
                        {doc.category}
                      </span>
                    </td>
                    <td>
                      <label className="switch" style={{ width: '38px', height: '20px' }}>
                        <input
                          type="checkbox"
                          checked={doc.isMandatory}
                          onChange={e => handleUpdateDoc(idx, 'isMandatory', e.target.checked)}
                        />
                        <span className="switch-slider" style={{ borderRadius: '20px' }}></span>
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="range"
                          min={50}
                          max={99}
                          className="range-slider"
                          style={{ width: '90px' }}
                          value={doc.minOcrConfidence}
                          onChange={e => handleUpdateDoc(idx, 'minOcrConfidence', Number(e.target.value))}
                        />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, width: '35px' }}>
                          {doc.minOcrConfidence}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={0}
                          max={365}
                          className="input"
                          style={{ width: '64px', height: '30px', padding: '2px 6px', fontSize: 'var(--text-xs)' }}
                          value={doc.validityBufferDays}
                          onChange={e => handleUpdateDoc(idx, 'validityBufferDays', Number(e.target.value) || 0)}
                        />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>Days</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ color: 'var(--color-danger)', padding: '4px' }}
                        onClick={() => handleDeleteDoc(doc.id)}
                        title="Remove requirement rule"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 3. Verification Preferences ── */}
      <div className="settings-card" id="verification-preferences">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <CheckCircle2 size={18} className="text-navy" />
              Verification Preferences &amp; Registry Integrations
            </div>
            <div className="settings-card__subtitle">
              Direct API validation bridges with Government statutory databases and anti-tamper safeguards
            </div>
          </div>
        </div>

        <div className="settings-card__body">
          <div className="settings-grid-2">
            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">GSTN API Live Lookup</div>
                <div className="toggle-desc">Cross-verify legal trade name, active filing status, and jurisdiction via GST API.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.verification.verifyGstnLive}
                  onChange={e => updateVerification('verifyGstnLive', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Income Tax PAN Database Verification</div>
                <div className="toggle-desc">Validate PAN validity and Aadhaar/PAN entity binding with NSDL registry.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.verification.verifyPanLive}
                  onChange={e => updateVerification('verifyPanLive', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">MCA21 Corporate Registry Check</div>
                <div className="toggle-desc">Verify CIN, active director listings, and authorized capital on Ministry of Corporate Affairs.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.verification.verifyMca21Registry}
                  onChange={e => updateVerification('verifyMca21Registry', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Cryptographic Document Tamper Check</div>
                <div className="toggle-desc">Compute SHA256 checksum and inspect PDF modification trailer history for tampering.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.verification.enableDocumentTamperCheck}
                  onChange={e => updateVerification('enableDocumentTamperCheck', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="gemRating">
                GeM Seller Minimum Star Rating Cutoff
                <span className="form-helper-val">{data.verification.gemSellerMinRating} / 5.0 Stars</span>
              </label>
              <input
                id="gemRating"
                type="number"
                min={1.0}
                max={5.0}
                step={0.1}
                className="input"
                value={data.verification.gemSellerMinRating}
                onChange={e => updateVerification('gemSellerMinRating', Number(e.target.value) || 3.0)}
              />
              <span className="form-hint">Historical vendor incident delivery performance threshold on GeM.</span>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Require Dual Sign-Off for Manual Overrides</div>
                <div className="toggle-desc">Mandate secondary approval from Vigilance Officer if an officer waives an exhibit.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={data.verification.requireDualSignoffForOverride}
                  onChange={e => updateVerification('requireDualSignoffForOverride', e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Compliance Configuration ── */}
      <div className="settings-card" id="compliance-configuration">
        <div className="settings-card__header">
          <div>
            <div className="settings-card__title">
              <SlidersHorizontal size={18} className="text-navy" />
              Compliance Configuration &amp; Evaluation Pillars
            </div>
            <div className="settings-card__subtitle">
              Pillar weight allocation, execution modes, and bidder notification transparency
            </div>
          </div>
          {totalPillarWeights !== 100 ? (
            <span className="badge badge--critical">
              <AlertTriangle size={12} />
              Weights Sum: {totalPillarWeights}% (Must equal 100%)
            </span>
          ) : (
            <span className="badge badge--low">Balanced: 100% Total</span>
          )}
        </div>

        <div className="settings-card__body">
          <div className="settings-grid-3">
            <div className="form-field">
              <label className="form-label" htmlFor="eligWeight">
                Eligibility &amp; Legal Weight (%)
              </label>
              <input
                id="eligWeight"
                type="number"
                min={0}
                max={100}
                className="input weight-input"
                value={data.configuration.eligibilityWeight}
                onChange={e => updateConfig('eligibilityWeight', Number(e.target.value) || 0)}
              />
              <span className="form-hint">Statutory registration and non-debarment.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="techWeight">
                Technical Specification Weight (%)
              </label>
              <input
                id="techWeight"
                type="number"
                min={0}
                max={100}
                className="input weight-input"
                value={data.configuration.technicalWeight}
                onChange={e => updateConfig('technicalWeight', Number(e.target.value) || 0)}
              />
              <span className="form-hint">OEM authorizations and parameter compliance.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="finWeight">
                Financial &amp; Commercial Weight (%)
              </label>
              <input
                id="finWeight"
                type="number"
                min={0}
                max={100}
                className="input weight-input"
                value={data.configuration.financialWeight}
                onChange={e => updateConfig('financialWeight', Number(e.target.value) || 0)}
              />
              <span className="form-hint">Turnover, ITR verification, and EMD.</span>
            </div>
          </div>

          <div className="settings-grid-2">
            <div className="form-field">
              <label className="form-label" htmlFor="execMode">
                Compliance Execution Pipeline Mode
              </label>
              <select
                id="execMode"
                className="select"
                value={data.configuration.executionMode}
                onChange={e => updateConfig('executionMode', e.target.value)}
              >
                <option value="SYNCHRONOUS">Synchronous (Evaluate upon upload immediately)</option>
                <option value="BACKGROUND_QUEUE">Background Queue (Worker thread async evaluation)</option>
              </select>
              <span className="form-hint">Synchronous recommended for sub-100MB bid packages.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="feedbackLevel">
                Bidder Feedback Report Detail Level
              </label>
              <select
                id="feedbackLevel"
                className="select"
                value={data.configuration.bidderFeedbackDetailLevel}
                onChange={e => updateConfig('bidderFeedbackDetailLevel', e.target.value)}
              >
                <option value="DETAILED_BREAKDOWN">Detailed Forensic Breakdown (Specific clause &amp; OCR discrepancies)</option>
                <option value="STANDARD">Standard Summary (Pass/Fail category totals only)</option>
              </select>
              <span className="form-hint">Controls information visibility in the public vendor portal.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Document Rule Modal ── */}
      {showAddDocModal && (
        <div className="settings-modal-backdrop" onClick={() => setShowAddDocModal(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-modal__header">
              <div className="settings-card__title">
                <Plus size={18} className="text-navy" />
                Add Required Document Rule
              </div>
            </div>
            <form onSubmit={handleAddDocument}>
              <div className="settings-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-field">
                  <label className="form-label" htmlFor="docModalName">Document Title</label>
                  <input
                    id="docModalName"
                    required
                    type="text"
                    className="input"
                    placeholder="e.g. ISO 9001 Quality Certificate"
                    value={newDoc.name || ''}
                    onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                  />
                </div>

                <div className="settings-grid-2">
                  <div className="form-field">
                    <label className="form-label" htmlFor="docModalCode">Rule Code</label>
                    <input
                      id="docModalCode"
                      required
                      type="text"
                      className="input"
                      placeholder="DOC_ISO_9001"
                      value={newDoc.code || ''}
                      onChange={e => setNewDoc({ ...newDoc, code: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="docModalCat">Category</label>
                    <select
                      id="docModalCat"
                      className="select"
                      value={newDoc.category}
                      onChange={e => setNewDoc({ ...newDoc, category: e.target.value as any })}
                    >
                      <option value="LEGAL">LEGAL</option>
                      <option value="TECHNICAL">TECHNICAL</option>
                      <option value="FINANCIAL">FINANCIAL</option>
                      <option value="STATUTORY">STATUTORY</option>
                    </select>
                  </div>
                </div>

                <div className="settings-grid-2">
                  <div className="form-field">
                    <label className="form-label" htmlFor="docModalOcr">Min OCR Confidence (%)</label>
                    <input
                      id="docModalOcr"
                      type="number"
                      min={50}
                      max={99}
                      className="input"
                      value={newDoc.minOcrConfidence || 75}
                      onChange={e => setNewDoc({ ...newDoc, minOcrConfidence: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="docModalBuffer">Validity Buffer (Days)</label>
                    <input
                      id="docModalBuffer"
                      type="number"
                      min={0}
                      max={365}
                      className="input"
                      value={newDoc.validityBufferDays || 30}
                      onChange={e => setNewDoc({ ...newDoc, validityBufferDays: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="toggle-row">
                  <div className="toggle-info">
                    <div className="toggle-title">Mandatory Requirement</div>
                    <div className="toggle-desc">Bid will fail compliance if this document is absent.</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={newDoc.isMandatory}
                      onChange={e => setNewDoc({ ...newDoc, isMandatory: e.target.checked })}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowAddDocModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save Document Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

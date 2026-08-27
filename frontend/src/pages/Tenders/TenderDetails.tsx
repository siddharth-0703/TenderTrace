import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenderApi } from '../../services/api/tenderApi';
import { UploadCloud, CheckCircle2, PlayCircle, Loader2, AlertTriangle, XCircle } from 'lucide-react';

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'requirements'>('documents');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: tender, isLoading } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => tenderApi.getTenderDetails(id!),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => tenderApi.uploadDocuments(id!, files),
    onSuccess: () => {
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['tender', id] });
    },
  });

  const processMutation = useMutation({
    mutationFn: () => tenderApi.processPackage(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender', id] });
    },
  });

  if (isLoading) return <div className="text-muted">Loading tender details...</div>;
  if (!tender) return <div className="text-error">Tender not found.</div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>{tender.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="font-mono">{tender.id}</span>
            <span>•</span>
            <span>{tender.department}</span>
            <span>•</span>
            <span className={`badge ${tender.processingStatus === 'PROCESSED' ? 'badge-success' : 'badge-neutral'}`}>
              {tender.processingStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents ({tender.documents?.length || 0})</button>
        <button className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`} onClick={() => setActiveTab('requirements')}>Requirements ({tender.requirements?.length || 0})</button>
      </div>

      {activeTab === 'documents' && (
        <div className="flex gap-6">
          <div className="flex-col gap-4 flex-1">
            <div className="card">
              <h3 className="text-h3">Upload Tender Package</h3>
              <p className="text-muted text-sm mb-4">Upload all tender PDFs (main tender, BOQ, corrigenda, etc.) for Phase 4 cross-document processing.</p>
              
              <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
                <UploadCloud size={40} className="text-muted mx-auto mb-2" />
                <div className="text-sm font-semibold mb-1">Select multiple PDFs</div>
                <input type="file" multiple accept=".pdf" onChange={handleFileChange} />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-2">{selectedFiles.length} files selected</div>
                  <ul className="text-sm text-muted mb-4" style={{ paddingLeft: '1.5rem' }}>
                    {selectedFiles.map(f => <li key={f.name}>{f.name} ({(f.size/1024).toFixed(1)} KB)</li>)}
                  </ul>
                  <button className="btn btn-primary" onClick={handleUpload} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Documents'}
                  </button>
                </div>
              )}
            </div>

            <div className="card mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-h3">Uploaded Documents</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={() => processMutation.mutate()} 
                  disabled={processMutation.isPending || tender.documents?.length === 0}
                >
                  {processMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                  {processMutation.isPending ? 'Processing Package...' : 'Process Package (Phase 4)'}
                </button>
              </div>

              {tender.documents?.length === 0 ? (
                <p className="text-muted text-sm">No documents uploaded yet.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Pages</th>
                        <th>Classification</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tender.documents?.map((doc: any) => (
                        <tr key={doc.id}>
                          <td className="font-medium">{doc.filename}</td>
                          <td className="text-sm font-mono text-muted">{doc.pageCount || '-'}</td>
                          <td>
                            {doc.documentClass ? (
                              <span className="badge badge-primary">{doc.documentClass}</span>
                            ) : (
                              <span className="text-muted text-xs">Unclassified</span>
                            )}
                          </td>
                          <td>
                            {doc.processingStatus === 'SUCCESS' || doc.processingStatus === 'PROCESSED' ? (
                              <span className="flex items-center gap-1 text-success text-xs font-bold"><CheckCircle2 size={14} /> {doc.processingStatus}</span>
                            ) : doc.processingStatus === 'PARTIAL' || doc.processingStatus === 'OCR_REQUIRED' ? (
                              <span className="flex items-center gap-1 text-warning text-xs font-bold"><AlertTriangle size={14} /> {doc.processingStatus}</span>
                            ) : doc.processingStatus === 'FAILED' ? (
                              <span className="flex items-center gap-1 text-error text-xs font-bold"><XCircle size={14} /> FAILED</span>
                            ) : (
                              <span className="badge badge-neutral flex items-center gap-1">
                                {doc.processingStatus === 'EXTRACTING' && <Loader2 size={12} className="animate-spin" />}
                                {doc.processingStatus}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requirements' && (
        <div className="card">
          <h3 className="text-h3 mb-4">Extracted Requirements</h3>
          {tender.requirements?.length === 0 ? (
            <p className="text-muted text-sm">No requirements extracted. Run package processing first.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Rule / Value</th>
                    <th>Status</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {tender.requirements?.map((req: any) => (
                    <tr key={req.id}>
                      <td className="font-semibold">{req.type}</td>
                      <td className="font-mono text-sm">{JSON.stringify(req.rule)}</td>
                      <td>
                        <span className={`badge ${req.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${req.reviewStatus === 'APPROVED' ? 'badge-success' : (req.reviewStatus === 'CONFLICTING' ? 'badge-error' : 'badge-warning')}`}>
                          {req.reviewStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

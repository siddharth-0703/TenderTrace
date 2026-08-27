import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, X, File as FileIcon, Loader2 } from 'lucide-react';

interface Props {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
}

export function FileUpload({ onUpload, accept = '.pdf', multiple = true, maxSizeMB = 50 }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);
    
    const validFiles: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    Array.from(newFiles).forEach(file => {
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} exceeds the ${maxSizeMB}MB limit.`);
        return;
      }
      if (!multiple && validFiles.length > 0) return;
      if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [multiple, selectedFiles]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => setIsDragOver(false);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '32px 24px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease',
          backgroundColor: isDragOver ? 'var(--color-info-bg)' : 'var(--color-background)',
          opacity: isUploading ? 0.5 : 1,
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)} 
        />
        <UploadCloud size={36} color={isDragOver ? 'var(--color-accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 12px auto', display: 'block' }} />
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '14px' }}>
          Drag & drop files here
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          or click to browse • {accept} • Max {maxSizeMB}MB
        </p>
      </div>

      {error && (
        <div style={{ marginTop: '12px', padding: '10px 16px', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedFiles.map((f, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', minWidth: 0 }}>
                  <FileIcon size={18} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {!isUploading && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', borderRadius: '4px' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={isUploading}
            style={{ marginTop: '16px', width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            {isUploading && <Loader2 className="animate-spin" size={16} />}
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}

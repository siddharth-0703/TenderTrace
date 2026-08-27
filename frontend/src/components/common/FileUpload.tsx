import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, X, File as FileIcon, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
}

export function FileUpload({ onUpload, accept = '.pdf', multiple = true, maxSizeMB = 50 }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);
    
    const validFiles: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    Array.from(newFiles).forEach(file => {
      // Very basic validation
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} exceeds the ${maxSizeMB}MB limit.`);
        return;
      }
      if (!multiple && validFiles.length > 0) return;
      
      // Duplicate check
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
    handleFiles(e.dataTransfer.files);
  }, [multiple, selectedFiles]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]); // clear on success
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={clsx(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-slate-50",
          isUploading ? "opacity-50 pointer-events-none" : ""
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)} 
        />
        <UploadCloud className="mx-auto mb-4 text-slate-400" size={48} />
        <h4 className="text-h4 mb-2">Drag & Drop files here</h4>
        <p className="text-muted text-sm">or click to select files ({accept})</p>
      </div>

      {error && <div className="text-error text-sm mt-3">{error}</div>}

      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h5 className="font-semibold mb-2">Selected Files</h5>
          <ul className="space-y-2">
            {selectedFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between p-3 bg-white border rounded-md">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="text-primary shrink-0" size={20} />
                  <span className="truncate text-sm">{f.name}</span>
                  <span className="text-xs text-muted shrink-0">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {!isUploading && (
                  <button onClick={() => removeFile(i)} className="text-muted hover:text-error p-1">
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          
          <button 
            className="btn btn-primary mt-4 w-full flex justify-center items-center gap-2"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading && <Loader2 className="animate-spin" size={18} />}
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}

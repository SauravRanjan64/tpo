import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Button from './Button';

export const FileUpload = ({
  onFileSelect,
  accept = '.pdf,.docx',
  maxSizeMB = 5,
  label = 'Upload Document',
  helper = 'PDF or DOCX up to 5MB'
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSet = (file) => {
    setError(null);
    if (!file) return;

    // Check size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds maximum limit of ${maxSizeMB}MB.`);
      return;
    }

    // Check extension
    const ext = `.${file.name.split('.').pop().toLowerCase()}`;
    const acceptedList = accept.split(',').map(s => s.trim().toLowerCase());
    if (!acceptedList.includes(ext)) {
      setError(`Invalid file format. Allowed formats: ${accept}`);
      return;
    }

    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            validateAndSet(e.target.files[0]);
          }
        }}
      />

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
          }`}
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-800 mb-1">{label}</p>
          <p className="text-xs text-slate-500 mb-3">{helper}</p>
          <Button variant="outline" size="sm" type="button">
            Browse File
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[220px] sm:max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

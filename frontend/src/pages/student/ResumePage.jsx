import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import resumeApi from '../../services/resumeApi';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FileUpload from '../../components/common/FileUpload';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  FileText,
  UploadCloud,
  Trash2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Calendar,
  HardDrive
} from 'lucide-react';

export const ResumePage = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadMode, setShowUploadMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['resume'],
    queryFn: () => resumeApi.getResume(),
  });

  const resume = data?.resume;

  const uploadMutation = useMutation({
    mutationFn: (file) =>
      resumeApi.uploadResume(file),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Resume Uploaded',
        message: 'Your updated resume is now saved for all campus placement drives.',
      });
      setShowUploadMode(false);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['resume'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.response?.data?.message || 'Could not upload resume.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => resumeApi.deleteResume(),
    onSuccess: () => {
      showToast({
        type: 'info',
        title: 'Resume Removed',
        message: 'Your resume has been deleted from the portal.',
      });
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['resume'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not remove resume.',
      });
    },
  });

  if (isLoading) return <CardSkeleton count={1} />;
  if (error) {
    return (
      <ErrorState
        title="Unable to load resume"
        message="Could not retrieve your stored resume."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Placement Resume
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your uploaded resume is automatically presented to visiting companies when you apply for drives.
          </p>
        </div>
        <Link to="/student/resume/match">
          <Button variant="outline" size="sm" leftIcon={Sparkles}>
            Test Resume Matcher
          </Button>
        </Link>
      </div>

      {/* Current Resume Card */}
      <Card title="Current Placement Resume" subtitle="Primary document used across applications">
        {resume ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate max-w-sm">
                    {resume.fileName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Uploaded: {resume.uploadDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      {resume.fileSize || '1.2 MB'}
                    </span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>

            {/* Extracted Skills Preview */}
            {resume.skills && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Recognized Technical Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions: Replace, Delete */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadMode(!showUploadMode)}
                leftIcon={RefreshCw}
              >
                {showUploadMode ? 'Cancel Replacement' : 'Replace Resume'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                leftIcon={Trash2}
              >
                Delete Resume
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm font-medium text-slate-700 mb-1">
              No resume currently on file
            </p>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Please upload a PDF or DOCX format resume to ensure you can apply for active campus drives.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUploadMode(true)}
              leftIcon={UploadCloud}
            >
              Upload Resume Now
            </Button>
          </div>
        )}
      </Card>

      {/* Upload/Replace Box */}
      {(showUploadMode || !resume) && (
        <Card
          title={resume ? 'Replace Current Resume' : 'Upload New Resume'}
          subtitle="Maximum file size: 5 MB • Formats: PDF and DOCX"
        >
          <div className="space-y-4">
            <FileUpload
              maxSizeMB={5}
              accept=".pdf,.docx"
              label="Select your updated resume document"
              helper="Only PDF or DOCX allowed. Maximum file size 5MB."
              onFileSelect={setSelectedFile}
            />

            <div className="flex justify-end gap-2 pt-2">
              {resume && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUploadMode(false);
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedFile}
                isLoading={uploadMutation.isPending}
                onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
              >
                Confirm & Upload
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Resume?"
        description="Removing your resume will prevent you from submitting new placement applications until a new resume is uploaded."
        confirmText="Yes, Delete Resume"
        cancelText="Keep Resume"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ResumePage;

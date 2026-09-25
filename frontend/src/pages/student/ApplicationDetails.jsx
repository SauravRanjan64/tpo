import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import applicationApi from '../../services/applicationApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusTimeline from '../../components/common/StatusTimeline';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  ArrowLeft,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';

export const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['application-details', id],
    queryFn: () => applicationApi.getApplicationById(id),
  });

  const app = data?.application;

  if (isLoading) return <CardSkeleton count={2} />;
  if (error || !app) {
    return (
      <ErrorState
        title="Application record not found"
        message="Could not retrieve the requested application details."
        onRetry={refetch}
      />
    );
  }

  const eligibilitySnapshot = app.eligibilitySnapshot || {};
  const studentCgpa = eligibilitySnapshot.studentCgpa ?? eligibilitySnapshot.cgpa?.student;
  const requiredCgpa = eligibilitySnapshot.requiredCgpa ?? eligibilitySnapshot.cgpa?.required;
  const studentBranch = eligibilitySnapshot.studentBranch ?? eligibilitySnapshot.branch?.student;
  const studentBacklogs = eligibilitySnapshot.studentBacklogs ?? eligibilitySnapshot.backlogs?.student;
  const allowedBacklogs = eligibilitySnapshot.allowedBacklogs ?? eligibilitySnapshot.backlogs?.maxAllowed;
  const studentBatch = typeof eligibilitySnapshot.batch === 'object'
    ? eligibilitySnapshot.batch?.student
    : eligibilitySnapshot.batch;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/student/applications')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Applications</span>
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {app.job?.companyName || app.job?.company?.companyName || 'Campus Recruiter'}
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            {app.job?.title || 'Job Application'}
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
            <span>Application ID: <span className="font-mono text-slate-700">{app.id}</span></span>
            <span>•</span>
            <span>
              Applied on{' '}
              {new Date(app.appliedAt || app.appliedOn || app.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge status={app.status} size="lg" showDot />
          <span className="text-xs text-slate-400">Current Status</span>
        </div>
      </div>

      {/* Status Timeline */}
      <Card title="Application Status Timeline" subtitle="Real-time recruitment stage updates">
        <StatusTimeline timeline={app.timeline} currentStatus={app.status} />

        {app.status === 'REJECTED' && app.rejectionReason && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Feedback Note:</span>
              <p className="mt-0.5">{app.rejectionReason}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Verification Snapshot & Match Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Eligibility Snapshot" subtitle="Academic parameters verified at application time">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">CGPA:</span>
              <span className="font-semibold text-emerald-700">
                {studentCgpa} / {requiredCgpa} ✓
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">Branch:</span>
              <span className="font-semibold text-emerald-700">
                {studentBranch} ✓
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">Active Backlogs:</span>
              <span className="font-semibold text-emerald-700">
                {studentBacklogs} (Max: {allowedBacklogs}) ✓
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">Batch:</span>
              <span className="font-semibold text-emerald-700">
                {studentBatch} ✓
              </span>
            </div>
          </div>
        </Card>

        <Card title="Resume Match Overview" subtitle="Keyword alignment with job description">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Keyword Match Score</span>
              <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                {app.matchScore}%
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Matched Skills
              </span>
              <div className="flex flex-wrap gap-1">
                {app.matchedSkills?.map((s, idx) => (
                  <span key={idx} className="text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {app.missingSkills?.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Missing Skills
                </span>
                <div className="flex flex-wrap gap-1">
                  {app.missingSkills.map((s, idx) => (
                    <span key={idx} className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      • {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-start">
        <Link to={`/student/jobs/${app.jobId}`}>
          <Button variant="outline" size="sm">
            View Job Posting
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ApplicationDetails;

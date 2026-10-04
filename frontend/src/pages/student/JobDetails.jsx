import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import jobApi from '../../services/jobApi';
import applicationApi from '../../services/applicationApi';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  ArrowLeft,
  MapPin,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Award
} from 'lucide-react';

const formatDriveDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedAppId, setAppliedAppId] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['job-details', id],
    queryFn: () => jobApi.getJobById(id),
  });

  const job = data?.job;

  // Eligibility evaluation mutation
  const handleCheckEligibility = async () => {
    setIsCheckingEligibility(true);
    try {
      const res = await jobApi.checkEligibility(id);
      setEligibilityResult(res?.eligible !== undefined ? res : res?.result || res);
      if (res.eligible) {
        showToast({
          type: 'success',
          title: 'Eligibility Confirmed',
          message: 'You fulfill all academic criteria for this placement drive!',
        });
      } else {
        showToast({
          type: 'warning',
          title: 'Criteria Mismatch',
          message: 'You do not meet one or more academic requirements for this drive.',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Check Failed',
        message: err.response?.data?.message || 'Failed to verify eligibility.',
      });
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  // Submit application mutation
  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(id),
    onSuccess: (res) => {
      setShowApplyModal(false);
      setAppliedAppId(res.application?.id);
      showToast({
        type: 'success',
        title: 'Application Submitted',
        message: 'Your application has been registered with the T&P Cell.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Application Failed',
        message: err.response?.data?.message || 'Unable to submit application.',
      });
    },
  });

  if (isLoading) return <CardSkeleton count={2} />;
  if (error || !job) {
    return (
      <ErrorState
        title="Placement drive not found"
        message="The requested job drive could not be loaded."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/student/jobs')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Placement Drives</span>
      </button>

      {/* Main Drive Overview Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {job.companyName}
              </span>
              <Badge status={job.status} size="sm" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.location}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-indigo-600">{job.jobType}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <IndianRupee className="w-3 h-3" />
                {job.salaryRange}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Academic Window */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Application Opens</span>
            <span className="font-medium text-slate-800">{formatDriveDate(job.applicationStart)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Application Deadline</span>
            <span className="font-medium text-slate-800">{formatDriveDate(job.applicationEnd)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Eligible Batch</span>
            <span className="font-medium text-slate-800">{job.eligibleBatches?.length ? job.eligibleBatches.map((batch) => `Batch ${batch}`).join(', ') : 'All batches'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Minimum CGPA</span>
            <span className="font-medium text-slate-800">{job.minCgpa} / 10.0</span>
          </div>
        </div>

        {/* Job Description */}
        <div className="py-5 space-y-4 text-sm text-slate-700">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              About the Role & Organization
            </h4>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
              {job.description}
            </p>
          </div>

          {/* Required Skills */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Required Technical Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Allowed Branches */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Allowed Engineering Disciplines
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.allowedBranches?.map((br, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700"
                >
                  {br}
                </span>
              ))}
            </div>
          </div>

          {/* Selection Rounds if specified */}
          {job.selectionRounds && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Hiring & Evaluation Process
              </h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                {job.selectionRounds.map((round, i) => (
                  <li key={i}>{round}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Eligibility Evaluation Experience Card */}
      <Card
        title="Eligibility Verification"
        subtitle="Automatic verification against your official academic record"
        className="border-indigo-100"
      >
        {!eligibilityResult ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Verify Your Eligibility
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click below to evaluate your CGPA, academic branch, active backlogs, and graduation batch against the requirements set by {job.companyName}.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleCheckEligibility}
                isLoading={isCheckingEligibility}
              >
                Check Eligibility
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Status Header */}
            {eligibilityResult.eligible ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    ✓ You are eligible for this placement drive
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Your academic records satisfy all cutoff parameters. You can submit your application.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    ✕ You are not eligible for this placement drive
                  </h4>
                  <p className="text-xs text-rose-700">
                    You do not meet one or more prerequisite criteria configured by the company.
                  </p>
                </div>
              </div>
            )}

            {/* Criteria Breakdown Grid */}
            {eligibilityResult.details?.cgpa && eligibilityResult.details?.branch && eligibilityResult.details?.backlogs && eligibilityResult.details?.batch && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* CGPA */}
              <div
                className={`p-3 rounded-lg border ${
                  eligibilityResult.details.cgpa.pass
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>CGPA Requirement</span>
                  {eligibilityResult.details.cgpa.pass ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✕</span>
                  )}
                </div>
                <div className="text-slate-600">
                  Required: {eligibilityResult.details.cgpa.required}
                </div>
                <div className="font-semibold mt-0.5">
                  Your CGPA: {eligibilityResult.details.cgpa.student}
                </div>
              </div>

              {/* Branch */}
              <div
                className={`p-3 rounded-lg border ${
                  eligibilityResult.details.branch.pass
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>Branch Allowed</span>
                  {eligibilityResult.details.branch.pass ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✕</span>
                  )}
                </div>
                <div className="text-slate-600 truncate">
                  Allowed: {(eligibilityResult.details.branch.allowed || []).join(', ') || '—'}
                </div>
                <div className="font-semibold mt-0.5">
                  Your Branch: {eligibilityResult.details.branch.student}
                </div>
              </div>

              {/* Backlogs */}
              <div
                className={`p-3 rounded-lg border ${
                  eligibilityResult.details.backlogs.pass
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>Active Backlogs</span>
                  {eligibilityResult.details.backlogs.pass ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✕</span>
                  )}
                </div>
                <div className="text-slate-600">
                  Max allowed: {eligibilityResult.details.backlogs.maxAllowed}
                </div>
                <div className="font-semibold mt-0.5">
                  Your Backlogs: {eligibilityResult.details.backlogs.student}
                </div>
              </div>

              {/* Batch */}
              <div
                className={`p-3 rounded-lg border ${
                  eligibilityResult.details.batch.pass
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>Graduating Batch</span>
                  {eligibilityResult.details.batch.pass ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✕</span>
                  )}
                </div>
                <div className="text-slate-600">
                  Required: {eligibilityResult.details.batch.required}
                </div>
                <div className="font-semibold mt-0.5">
                  Your Batch: {eligibilityResult.details.batch.student}
                </div>
              </div>
            </div>
            )}

            {/* Ineligibility Reason List if any */}
            {!eligibilityResult.eligible && eligibilityResult.reasons?.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-rose-200 text-xs text-rose-800 space-y-1">
                <span className="font-semibold block">Specific Reasons for Ineligibility:</span>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                  {eligibilityResult.reasons.map((r, i) => (
                    <li key={i}>{typeof r === 'string' ? r : r.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Actions based on eligibility */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/student/jobs')}
              >
                Back to Jobs
              </Button>

              {eligibilityResult.eligible && !appliedAppId && (
                <Button
                  variant="success"
                  size="md"
                  onClick={() => setShowApplyModal(true)}
                >
                  Apply Now
                </Button>
              )}

              {appliedAppId && (
                <Link to={`/student/applications/${appliedAppId}`}>
                  <Button variant="primary" size="sm">
                    View Application
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Apply Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onConfirm={() => applyMutation.mutate()}
        title={`Apply for ${job.title}?`}
        description={`Your academic profile and primary resume will be submitted to the T&P Cell for ${job.companyName}.`}
        confirmText="Confirm Apply"
        cancelText="Cancel"
        variant="primary"
        isLoading={applyMutation.isPending}
      />
    </div>
  );
};

export default JobDetails;

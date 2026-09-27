import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import companyApi from '../../services/companyApi';
import { useToast } from '../../contexts/ToastContext';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import SearchBox from '../../components/common/SearchBox';
import Filter from '../../components/common/Filter';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { CheckCircle2, XCircle, Users, Lock, Eye, Check } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'APPLIED', label: 'Applied (Pending)' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const CompanyApplicants = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [branch, setBranch] = useState('ALL');
  const [minCgpa, setMinCgpa] = useState('ALL');
  const [maxBacklogs, setMaxBacklogs] = useState('ALL');
  const [minMatchScore, setMinMatchScore] = useState('ALL');
  const [applicantToShortlist, setApplicantToShortlist] = useState(null);
  const [applicantToReject, setApplicantToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingApplicant, setViewingApplicant] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['company-applicants', { status, branch, minCgpa, maxBacklogs, minMatchScore, search }],
    queryFn: () => companyApi.getApplicants({
      status,
      branch: branch === 'ALL' ? undefined : branch,
      minCgpa: minCgpa === 'ALL' ? undefined : minCgpa,
      maxBacklogs: maxBacklogs === 'ALL' ? undefined : maxBacklogs,
      minMatchScore: minMatchScore === 'ALL' ? undefined : minMatchScore,
      search: search || undefined,
    }),
  });

  const applicants = data?.applicants || [];

  // Shortlist mutation
  const shortlistMutation = useMutation({
    mutationFn: (appId) => companyApi.shortlistApplicant(appId),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Candidate Shortlisted',
        message: 'Applicant status updated to SHORTLISTED. Student notified.',
      });
      setApplicantToShortlist(null);
      queryClient.invalidateQueries({ queryKey: ['company-applicants'] });
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.message || 'Could not shortlist applicant.',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ appId, reason }) => companyApi.rejectApplicant(appId, reason),
    onSuccess: () => {
      showToast({
        type: 'info',
        title: 'Application Rejected',
        message: 'Applicant status updated to REJECTED.',
      });
      setApplicantToReject(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['company-applicants'] });
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.message || 'Could not reject application.',
      });
    },
  });

  const columns = [
    {
      header: 'Student Candidate',
      accessor: 'studentName',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.studentName}</span>
          <span className="text-xs text-slate-400 font-mono">
            {row.rollNumber} • ID: {row.id}
          </span>
        </div>
      ),
    },
    {
      header: 'Branch',
      accessor: 'branch',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">{row.branch}</span>
      ),
    },
    {
      header: 'CGPA',
      accessor: 'cgpa',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">{row.cgpa} / 10.0</span>
      ),
    },
    {
      header: 'Backlogs',
      accessor: 'activeBacklogs',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.activeBacklogs}</span>
      ),
    },
    {
      header: 'Match',
      accessor: 'matchScore',
      render: (row) => (
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
          {row.matchScore}%
        </span>
      ),
    },
    {
      header: 'Contact Info',
      accessor: 'phone',
      render: (row) => {
        return (
          <div className="text-xs">
            <span className="font-mono block text-slate-400">
              {row.phone}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3" /> Student contact details are masked
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} size="sm" showDot />,
    },
    {
      header: 'Recruiter Decision',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingApplicant(row)}
            leftIcon={Eye}
          >
            Details
          </Button>

          {row.status === 'APPLIED' && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => setApplicantToShortlist(row)}
                leftIcon={Check}
              >
                Shortlist
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setApplicantToReject(row)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Applicant Screening
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review verified candidate submissions, keyword match alignments, and update recruitment status.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search by student name, roll number, or application ID..."
          className="flex-1"
        />
        <Filter
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        <Filter label="Branch" value={branch} onChange={setBranch} options={[
          { value: 'ALL', label: 'All branches' }, 'CSE', 'IT', 'ECE', 'EEE', 'MECHANICAL', 'CIVIL', 'BIOTECHNOLOGY',
        ]} />
        <Filter label="Min CGPA" value={minCgpa} onChange={setMinCgpa} options={[
          { value: 'ALL', label: 'Any CGPA' }, '6', '7', '8', '9',
        ]} />
        <Filter label="Max backlogs" value={maxBacklogs} onChange={setMaxBacklogs} options={[
          { value: 'ALL', label: 'Any backlogs' }, '0', '1', '2',
        ]} />
        <Filter label="Min match" value={minMatchScore} onChange={setMinMatchScore} options={[
          { value: 'ALL', label: 'Any match' }, '50', '75', '90',
        ]} />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : error ? (
        <ErrorState
          title="Unable to load applicants"
          message="Could not retrieve candidate applications."
          onRetry={refetch}
        />
      ) : applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants found"
          description="No candidate applications matched the active search filters."
        />
      ) : (
        <Table columns={columns} data={applicants} />
      )}

      {/* Shortlist Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!applicantToShortlist}
        onClose={() => setApplicantToShortlist(null)}
        onConfirm={() => shortlistMutation.mutate(applicantToShortlist.id)}
        title={`Shortlist ${applicantToShortlist?.studentName}?`}
        description="The student will receive a real-time notification on their portal. Student contact details remain private."
        confirmText="Confirm Shortlist"
        cancelText="Cancel"
        variant="success"
        isLoading={shortlistMutation.isPending}
      />

      {/* Reject Confirmation Modal with Optional Reason */}
      <ConfirmDialog
        isOpen={!!applicantToReject}
        onClose={() => {
          setApplicantToReject(null);
          setRejectionReason('');
        }}
        onConfirm={() =>
          rejectMutation.mutate({
            appId: applicantToReject.id,
            reason: rejectionReason,
          })
        }
        title={`Reject application for ${applicantToReject?.studentName}?`}
        confirmText="Confirm Rejection"
        cancelText="Cancel"
        variant="danger"
        isLoading={rejectMutation.isPending}
      >
        <div className="mt-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Optional Reason / Feedback Note
          </label>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Candidate profile did not meet assessment cutoff."
            className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
          />
        </div>
      </ConfirmDialog>

      {/* Candidate Details Modal */}
      {viewingApplicant && (
        <Modal
          isOpen={!!viewingApplicant}
          onClose={() => setViewingApplicant(null)}
          title={`Candidate Profile — ${viewingApplicant.studentName}`}
          subtitle={`Roll No: ${viewingApplicant.rollNumber} • ${viewingApplicant.branch}`}
          maxWidth="max-w-lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setViewingApplicant(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Academic Branch</span>
                <span className="font-semibold text-slate-800">{viewingApplicant.branch}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">CGPA</span>
                <span className="font-semibold text-slate-800">{viewingApplicant.cgpa} / 10.0</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Active Backlogs</span>
                <span className="font-semibold text-slate-800">{viewingApplicant.activeBacklogs}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Keyword Match</span>
                <span className="font-semibold text-indigo-700">{viewingApplicant.matchScore}%</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Candidate Skills Recognized
              </span>
              <div className="flex flex-wrap gap-1">
                {viewingApplicant.resumeSkills?.map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 space-y-1">
              <span className="font-semibold text-indigo-900 block">Contact Information</span>
              <p className="text-slate-700 font-mono">Phone: {viewingApplicant.phone}</p>
              <p className="text-slate-600">Student contact details are protected by the T&amp;P Cell.</p>
            </div>
            {viewingApplicant.resumeUrl && (
              <a
                href={viewingApplicant.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                View submitted resume
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CompanyApplicants;

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import adminApi from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import SearchBox from '../../components/common/SearchBox';
import Filter from '../../components/common/Filter';
import Button from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { FileCheck, Check, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const AdminApplications = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-applications', { status, search }],
    queryFn: () => adminApi.getApplications({ status, search: search || undefined }),
  });

  const applications = data?.applications || [];

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, nextStatus }) =>
      adminApi.updateApplicationStatus(applicationId, nextStatus),
    onSuccess: (_, { nextStatus }) => {
      showToast({
        type: 'success',
        title: `Application ${nextStatus.toLowerCase()}`,
        message: 'The student has been notified of this update.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Status update failed',
        message: err.response?.data?.message || 'Could not update this application.',
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
            {row.rollNumber} • {row.branch}
          </span>
        </div>
      ),
    },
    {
      header: 'Placement Drive',
      accessor: 'companyName',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block">{row.companyName}</span>
          <span className="text-xs text-slate-500">{row.jobTitle}</span>
        </div>
      ),
    },
    {
      header: 'CGPA',
      accessor: 'cgpa',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.cgpa} / 10.0</span>
      ),
    },
    {
      header: 'Match',
      accessor: 'matchScore',
      render: (row) => (
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
          {row.matchScore == null ? '—' : `${row.matchScore}%`}
        </span>
      ),
    },
    {
      header: 'Applied Date',
      accessor: 'appliedAt',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.appliedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Current Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} size="sm" showDot />,
    },
    {
      header: 'T&P Action',
      align: 'right',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          {row.status === 'APPLIED' && (
            <>
              <Button
                size="sm"
                variant="success"
                leftIcon={Check}
                isLoading={statusMutation.isPending && statusMutation.variables?.applicationId === row.id}
                onClick={() => statusMutation.mutate({ applicationId: row.id, nextStatus: 'SHORTLISTED' })}
              >
                Shortlist
              </Button>
              <Button
                size="sm"
                variant="danger"
                leftIcon={X}
                onClick={() => statusMutation.mutate({ applicationId: row.id, nextStatus: 'REJECTED' })}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'SHORTLISTED' && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={Check}
              isLoading={statusMutation.isPending && statusMutation.variables?.applicationId === row.id}
              onClick={() => statusMutation.mutate({ applicationId: row.id, nextStatus: 'SELECTED' })}
            >
              Select
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Application Tracking
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time cross-drive candidate submissions and interview shortlists.
        </p>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Filter by student name, roll number, or company..."
          className="flex-1"
        />
        <Filter
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : error ? (
        <ErrorState
          title="Unable to load applications"
          message="Could not retrieve application submissions."
          onRetry={refetch}
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No applications found"
          description="No student applications matched your criteria."
        />
      ) : (
        <Table columns={columns} data={applications} />
      )}
    </div>
  );
};

export default AdminApplications;

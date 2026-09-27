import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Plus, Briefcase, Eye, Calendar, IndianRupee } from 'lucide-react';

export const JobDriveManagement = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-drives'],
    queryFn: () => adminApi.getJobs(),
  });

  const drives = data?.drives || [];

  const columns = [
    {
      header: 'Placement Drive',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.title}</span>
          <span className="text-xs text-slate-500">{row.companyName}</span>
        </div>
      ),
    },
    {
      header: 'Location & Type',
      accessor: 'location',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-800 block">{row.location}</span>
          <span className="text-[11px] text-indigo-600 font-semibold">{row.jobType}</span>
        </div>
      ),
    },
    {
      header: 'CTC Package',
      accessor: 'salaryRange',
      render: (row) => (
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          {row.salaryRange}
        </span>
      ),
    },
    {
      header: 'Eligibility Criteria',
      accessor: 'minCgpa',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <span>CGPA &ge; {row.minCgpa} • Max Backlogs: {row.maxBacklogs}</span>
          <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
            {row.allowedBranches?.join(', ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Application Window',
      accessor: 'applicationEnd',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.applicationStart} to {row.applicationEnd}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} size="sm" showDot />,
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Link
          to={`/admin/jobs/${row.id}/edit`}
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
        >
          Edit Drive
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Job Drive Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure placement drives, academic cutoff criteria, and application timelines.
          </p>
        </div>
        <Link to="/admin/jobs/create">
          <Button variant="primary" size="sm" leftIcon={Plus}>
            Create Job Drive
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : error ? (
        <ErrorState
          title="Unable to load drives"
          message="Could not retrieve placement drives."
          onRetry={refetch}
        />
      ) : drives.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No drives created yet"
          description="Create your first university placement drive to start accepting applications."
          actionLabel="Create Drive"
          onAction={() => window.location.assign('/admin/jobs/create')}
        />
      ) : (
        <Table columns={columns} data={drives} />
      )}
    </div>
  );
};

export default JobDriveManagement;

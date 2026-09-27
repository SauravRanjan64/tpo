import React from 'react';
import { useQuery } from '@tanstack/react-query';
import companyApi from '../../services/companyApi';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { UserCheck, Phone } from 'lucide-react';

export const CompanyShortlisted = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['company-applicants', { status: 'SHORTLISTED' }],
    queryFn: () => companyApi.getApplicants({ status: 'SHORTLISTED' }),
  });

  const applicants = data?.applicants || [];

  const columns = [
    {
      header: 'Shortlisted Candidate',
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
      header: 'CGPA',
      accessor: 'cgpa',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">{row.cgpa} / 10.0</span>
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
      header: 'Masked Mobile',
      accessor: 'phone',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-mono font-medium">
          <Phone className="w-3.5 h-3.5 text-indigo-600" />
          <span>{row.phone}</span>
        </div>
      ),
    },
    {
      header: 'Stage Status',
      accessor: 'status',
      render: (row) => <Badge status="SHORTLISTED" size="sm" showDot />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Shortlisted Candidates
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Candidates qualified for interviews. Student phone numbers remain privacy-masked.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} cols={6} />
      ) : error ? (
        <ErrorState
          title="Unable to load shortlisted candidates"
          message="Could not retrieve shortlisted cohort."
          onRetry={refetch}
        />
      ) : applicants.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No shortlisted candidates yet"
          description="Review incoming applicants and shortlist candidates for the next recruitment stage."
        />
      ) : (
        <Table columns={columns} data={applicants} />
      )}
    </div>
  );
};

export default CompanyShortlisted;

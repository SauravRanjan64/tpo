import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import adminApi from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/common/Card';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

const BRANCH_OPTIONS = [
  { value: 'ALL', label: 'All Branches' },
  { value: 'CSE', label: 'CSE' },
  { value: 'IT', label: 'IT' },
  { value: 'ECE', label: 'ECE' },
  { value: 'EEE', label: 'EEE' },
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Civil', label: 'Civil' },
  { value: 'Biotechnology', label: 'Biotechnology' },
];

const BATCH_OPTIONS = [
  { value: 'ALL', label: 'All Batches' },
  { value: '2024', label: 'Batch 2024' },
  { value: '2025', label: 'Batch 2025' },
  { value: '2026', label: 'Batch 2026' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Application Statuses' },
  { value: 'APPLIED', label: 'Applied Candidates' },
  { value: 'SHORTLISTED', label: 'Shortlisted Candidates Only' },
  { value: 'SELECTED', label: 'Selected Offers Only' },
  { value: 'REJECTED', label: 'Rejected Applications' },
];

export const AdminExports = () => {
  const { showToast } = useToast();
  const [selectedDrive, setSelectedDrive] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  const { data: drivesData } = useQuery({
    queryKey: ['admin-drives'],
    queryFn: () => adminApi.getJobs(),
  });

  const drives = drivesData?.drives || [];
  const driveOptions = [
    { value: 'ALL', label: 'All Placement Drives' },
    ...drives.map((d) => ({
      value: d.id,
      label: `${d.companyName} — ${d.title}`,
    })),
  ];

  const exportMutation = useMutation({
    mutationFn: () =>
      adminApi.exportCsv({
        jobId: selectedDrive,
        status: selectedStatus,
        branch: selectedBranch,
        batch: selectedBatch,
      }),
    onSuccess: ({ blob, filename }) => {
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast({
        type: 'success',
        title: 'Export Generated',
        message: 'CSV candidate file downloaded successfully.',
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate CSV export. Please try again.',
      });
    },
  });

  const handleExport = (e) => {
    e.preventDefault();
    exportMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Export Candidate Data (CSV)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate structured CSV spreadsheets for company recruiters, university records, or offline interview evaluations.
        </p>
      </div>

      <Card title="Export Criteria Selection">
        <form onSubmit={handleExport} className="space-y-4">
          <Select
            label="Placement Drive"
            options={driveOptions}
            value={selectedDrive}
            onChange={(v) => setSelectedDrive(v)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Application Status"
              options={STATUS_OPTIONS}
              value={selectedStatus}
              onChange={(v) => setSelectedStatus(v)}
            />
            <Select
              label="Engineering Branch"
              options={BRANCH_OPTIONS}
              value={selectedBranch}
              onChange={(v) => setSelectedBranch(v)}
            />
          </div>

          <Select
            label="Graduating Batch"
            options={BATCH_OPTIONS}
            value={selectedBatch}
            onChange={(v) => setSelectedBatch(v)}
          />

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              The exported file will include candidate roll numbers, names, academic branch, CGPA, application status, and timestamps.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={Download}
              isLoading={exportMutation.isPending}
            >
              Export CSV
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminExports;

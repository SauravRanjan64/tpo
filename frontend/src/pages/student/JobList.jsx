import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import jobApi from '../../services/jobApi';
import SearchBox from '../../components/common/SearchBox';
import Filter from '../../components/common/Filter';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { MapPin, Calendar, Briefcase, IndianRupee, ArrowRight, CheckCircle2 } from 'lucide-react';

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

const JOB_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Job Types' },
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Internship', label: 'Internship' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active Drives' },
  { value: 'CLOSED', label: 'Closed Drives' },
];

export const JobList = () => {
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [jobType, setJobType] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', { search, branch, jobType, status }],
    queryFn: () => jobApi.getJobs({ search, branch, jobType, status }),
  });

  const jobs = data?.jobs || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Campus Placement Drives
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Explore upcoming company recruitment drives, verify academic eligibility, and apply before deadlines.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by company, job title, or location..."
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Filter
              label="Branch"
              value={branch}
              onChange={setBranch}
              options={BRANCH_OPTIONS}
            />
            <Filter
              label="Type"
              value={jobType}
              onChange={setJobType}
              options={JOB_TYPE_OPTIONS}
            />
            <Filter
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorState
          title="Unable to load placement drives"
          message="An error occurred while fetching campus drives. Please check your connection."
          onRetry={refetch}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No placement drives found"
          description="Try adjusting your search keyword or filters to find available campus drives."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setBranch('ALL');
            setJobType('ALL');
            setStatus('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {job.companyName}
                  </span>
                  <Badge status={job.status} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                  {job.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.location}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-600 font-semibold">{job.jobType}</span>
                </div>

                {/* Salary Highlight Badge */}
                <div className="mb-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50/80 text-indigo-700 text-xs font-semibold">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>{job.salaryRange}</span>
                </div>

                {/* Academic Criteria Grid */}
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allowed Branches:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                      {job.allowedBranches.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Minimum CGPA:</span>
                    <span className="font-semibold text-slate-800">{job.minCgpa} / 10.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Backlogs:</span>
                    <span className="font-semibold text-slate-800">{job.maxBacklogs}</span>
                  </div>
                  {job.eligibleBatches?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eligible Batch:</span>
                      <span className="font-semibold text-slate-800">{job.eligibleBatches.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Date: {job.applicationEnd}</span>
                </div>
                <Link to={`/student/jobs/${job.id}`}>
                  <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                    View Job
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;

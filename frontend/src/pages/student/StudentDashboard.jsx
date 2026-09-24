import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import studentApi from '../../services/studentApi';
import jobApi from '../../services/jobApi';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import {
  Briefcase,
  FileCheck,
  CheckCircle2,
  Award,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const StudentDashboard = () => {
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: () => studentApi.getStats(),
  });

  const { data: jobsData, isLoading: jobsLoading, error: jobsError, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs', { limit: 5 }],
    queryFn: () => jobApi.getJobs({ limit: 5 }),
  });

  const rawStats = statsData?.stats || statsData || {};
  const stats = {
    availableJobs: rawStats.activeDrivesCount ?? rawStats.availableJobs ?? 0,
    myApplications: rawStats.totalApplied ?? rawStats.myApplications ?? 0,
    shortlisted: rawStats.shortlisted ?? 0,
    selected: rawStats.selected ?? 0,
  };
  const jobs = jobsData?.jobs || [];

  if (statsLoading || jobsLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError || jobsError) {
    return (
      <ErrorState
        title="Failed to load student dashboard"
        message="Could not retrieve placement metrics or recent drives."
        onRetry={() => {
          refetchStats();
          refetchJobs();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-indigo-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 2024–2025 Placement Cycle Active
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome to Your Placement Portal
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
              Track university placement drives, check real-time academic eligibility, match your resume, and monitor your interview shortlists.
            </p>
          </div>
          <Link to="/student/jobs">
            <Button variant="outline" size="sm" className="bg-white text-indigo-900 hover:bg-indigo-50 border-0 font-semibold shadow-sm shrink-0">
              Browse All Drives
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Jobs"
          value={stats.availableJobs}
          subtitle="Active on campus"
          icon={Briefcase}
          colorScheme="indigo"
        />
        <StatCard
          title="My Applications"
          value={stats.myApplications}
          subtitle="Submitted so far"
          icon={FileCheck}
          colorScheme="blue"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          subtitle="Invited for interview"
          icon={CheckCircle2}
          colorScheme="amber"
        />
        <StatCard
          title="Selected"
          value={stats.selected}
          subtitle="Offers confirmed"
          icon={Award}
          colorScheme="emerald"
        />
      </div>

      {/* Latest Placement Drives Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Latest Placement Drives
            </h3>
            <p className="text-xs text-slate-500">
              Recently published recruitment drives visiting DCRUST
            </p>
          </div>
          <Link
            to="/student/jobs"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            title="No active placement drives"
            description="There are currently no active placement drives scheduled. Please check back soon."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {job.companyName}
                    </span>
                    <Badge status={job.status} size="sm" />
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                    {job.title}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>

                  {/* Criteria Info Chips */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs mb-4">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Package</span>
                      <span className="font-semibold text-slate-800">{job.salaryRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Min CGPA</span>
                      <span className="font-semibold text-slate-800">{job.minCgpa} / 10</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Max Backlogs</span>
                      <span className="font-semibold text-slate-800">{job.maxBacklogs}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Allowed</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {(job.allowedBranches || []).slice(0, 2).join(', ')}{(job.allowedBranches || []).length > 2 ? '...' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last Date: {job.applicationEnd}</span>
                  </div>
                  <Link to={`/student/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

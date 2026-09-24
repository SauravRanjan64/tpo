import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  Users,
  Building2,
  Briefcase,
  FileCheck,
  CheckCircle2,
  Award,
  ArrowRight,
  Plus,
  Download
} from 'lucide-react';

export const AdminDashboard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
  });

  const rawStats = data?.stats || data || {};
  const stats = {
    ...rawStats,
    totalStudents: rawStats.totalStudents || 0,
    activeCompanies: rawStats.activeCompanies ?? rawStats.totalCompanies ?? 0,
    activeDrives: rawStats.activeDrives ?? rawStats.activeJobDrives ?? 0,
    totalApplications: rawStats.totalApplications || 0,
    shortlisted: rawStats.shortlisted ?? rawStats.shortlistedCount ?? 0,
    selected: rawStats.selected ?? rawStats.selectedCount ?? 0,
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Failed to load admin dashboard"
        message="Could not retrieve placement metrics."
        onRetry={refetch}
      />
    );
  }

  const branchStats = stats.branchStats || [];
  const maxApps = Math.max(...branchStats.map((b) => b.applications), 1);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            T&P Cell Placement Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized placement monitoring, candidate screening, and recruitment drives for DCRUST Murthal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/exports">
            <Button variant="outline" size="sm" leftIcon={Download}>
              Export Data
            </Button>
          </Link>
          <Link to="/admin/jobs/create">
            <Button variant="primary" size="sm" leftIcon={Plus}>
              Create Job Drive
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 6 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Students"
          value={stats.totalStudents || 0}
          subtitle="Registered cohort"
          icon={Users}
          colorScheme="slate"
        />
        <StatCard
          title="Companies"
          value={stats.activeCompanies || 0}
          subtitle="Active recruiters"
          icon={Building2}
          colorScheme="indigo"
        />
        <StatCard
          title="Active Drives"
          value={stats.activeDrives || 0}
          subtitle="Open for applications"
          icon={Briefcase}
          colorScheme="blue"
        />
        <StatCard
          title="Applications"
          value={stats.totalApplications || 0}
          subtitle="Total submissions"
          icon={FileCheck}
          colorScheme="indigo"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted || 0}
          subtitle="Round 2 qualifiers"
          icon={CheckCircle2}
          colorScheme="amber"
        />
        <StatCard
          title="Selected"
          value={stats.selected || 0}
          subtitle="Offers placed"
          icon={Award}
          colorScheme="emerald"
        />
      </div>

      {/* Simple Clean Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications & Offers by Branch */}
        <Card
          title="Applications & Offers by Branch"
          subtitle="Engineering department placement participation"
        >
          <div className="space-y-3.5 pt-2">
            {branchStats.map((item) => {
              const appWidth = Math.round((item.applications / maxApps) * 100);
              return (
                <div key={item.branch} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.branch}</span>
                    <span className="text-slate-500">
                      <strong className="text-indigo-600">{item.applications}</strong> apps •{' '}
                      <strong className="text-emerald-600">{item.offers}</strong> offers
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${appWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Placement Status Distribution */}
        <Card
          title="Application Pipeline Status"
          subtitle="Distribution of all candidate applications across active drives"
        >
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">
                Applied
              </span>
              <span className="text-2xl font-bold text-indigo-900 mt-1 block">
                {stats.statusStats?.APPLIED || 0}
              </span>
              <span className="text-[11px] text-indigo-600 mt-0.5 block">
                Pending recruiter screening
              </span>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                Shortlisted
              </span>
              <span className="text-2xl font-bold text-blue-900 mt-1 block">
                {stats.statusStats?.SHORTLISTED || 0}
              </span>
              <span className="text-[11px] text-blue-600 mt-0.5 block">
                In online test / interview rounds
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                Selected
              </span>
              <span className="text-2xl font-bold text-emerald-900 mt-1 block">
                {stats.statusStats?.SELECTED || 0}
              </span>
              <span className="text-[11px] text-emerald-600 mt-0.5 block">
                Final offer letters issued
              </span>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-xl">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
                Rejected / Closed
              </span>
              <span className="text-2xl font-bold text-rose-900 mt-1 block">
                {stats.statusStats?.REJECTED || 0}
              </span>
              <span className="text-[11px] text-rose-600 mt-0.5 block">
                Did not clear assessments
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Drives & Recent Applications Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Placement Drives */}
        <Card
          title="Recent Placement Drives"
          subtitle="Latest drives posted on the portal"
          action={
            <Link to="/admin/jobs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {stats.recentDrives?.map((drive) => (
              <div key={drive.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900">{drive.title}</h4>
                  <span className="text-slate-500">
                    {drive.companyName} • {drive.salaryRange}
                  </span>
                </div>
                <div className="text-right">
                  <Badge status={drive.status} size="sm" />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Ends {drive.applicationEnd}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Applications */}
        <Card
          title="Recent Candidate Submissions"
          subtitle="Real-time incoming job applications"
          action={
            <Link to="/admin/applications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {stats.recentApplications?.map((app) => (
              <div key={app.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900">{app.studentName}</h4>
                  <span className="text-slate-500">
                    {app.rollNumber} • {app.branch} → {app.companyName}
                  </span>
                </div>
                <div className="text-right">
                  <Badge status={app.status} size="sm" />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Score: {app.matchScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

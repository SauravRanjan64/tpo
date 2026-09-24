import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import companyApi from '../../services/companyApi';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Award,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const CompanyDashboard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['company-stats'],
    queryFn: () => companyApi.getStats(),
  });

  const stats = data?.stats || data || {};

  if (isLoading) return <DashboardSkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Unable to load recruiter dashboard"
        message="Could not retrieve application analytics."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Company Recruitment Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Screen verified DCRUST applicants, review keyword match scores, and shortlist candidates.
          </p>
        </div>
        <Link to="/company/applicants">
          <Button variant="primary" size="sm" rightIcon={ArrowRight}>
            View All Applicants
          </Button>
        </Link>
      </div>

      {/* Top 5 Recruitment KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Active Drives"
          value={stats.activeDrives || 0}
          subtitle="Open for campus"
          icon={Briefcase}
          colorScheme="slate"
        />
        <StatCard
          title="Total Applicants"
          value={stats.totalApplicants || 0}
          subtitle="Registered submissions"
          icon={Users}
          colorScheme="indigo"
        />
        <StatCard
          title="Eligible Candidates"
          value={stats.eligibleCandidates || 0}
          subtitle="Cleared academic criteria"
          icon={CheckCircle2}
          colorScheme="blue"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted || 0}
          subtitle="Interview round"
          icon={CheckCircle2}
          colorScheme="amber"
        />
        <StatCard
          title="Selected"
          value={stats.selected || 0}
          subtitle="Final offers"
          icon={Award}
          colorScheme="emerald"
        />
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
        <p className="leading-relaxed">
          <strong className="font-semibold">University Privacy Safeguard:</strong> Candidate mobile phone numbers remain masked until they are formally shortlisted by your recruitment team for interview rounds.
        </p>
      </div>

      {/* Recent Applicants */}
      <Card
        title="Recent Applicants"
        subtitle="Latest candidates registered for your active placement drives"
        action={
          <Link to="/company/applicants" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            View All
          </Link>
        }
      >
        <div className="divide-y divide-slate-100">
          {stats.recentApplicants?.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No applicants yet.</p>
          ) : (
            stats.recentApplicants?.map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900">{app.studentName}</h4>
                  <span className="text-slate-500">
                    {app.rollNumber} • {app.branch} • CGPA: {app.cgpa}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Match: {app.matchScore}%
                  </span>
                  <Badge status={app.status} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default CompanyDashboard;

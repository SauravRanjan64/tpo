import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import resumeApi from '../../services/resumeApi';
import jobApi from '../../services/jobApi';
import Card from '../../components/common/Card';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  FileText,
  Briefcase,
  CheckCircle2,
  CircleDot,
  Info,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const ResumeMatcher = () => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [matchResult, setMatchResult] = useState(null);

  const { data: resumeData, isLoading: resumeLoading } = useQuery({
    queryKey: ['resume'],
    queryFn: () => resumeApi.getResume(),
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobApi.getJobs(),
  });

  const resume = resumeData?.resume;
  const jobs = jobsData?.jobs || [];

  const jobOptions = jobs.map((j) => ({
    value: j.id,
    label: `${j.companyName} — ${j.title} (${j.salaryRange})`,
  }));

  const matchMutation = useMutation({
    mutationFn: () =>
      resumeApi.matchResume({
        jobId: selectedJobId,
      }),
    onSuccess: (res) => {
      const match = res.match;
      setMatchResult({
        ...match,
        matchScore: match.score,
        targetJob: {
          title: match.jobTitle,
          companyName: jobs.find((job) => job.id === match.jobId)?.companyName,
        },
      });
    },
  });

  const handleCheckMatch = (e) => {
    e.preventDefault();
    if (!selectedJobId) return;
    matchMutation.mutate();
  };

  if (resumeLoading || jobsLoading) return <CardSkeleton count={2} />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/student/resume"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Resume Management</span>
      </Link>

      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Resume Match
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Evaluate keyword overlap between your uploaded resume and target job descriptions to identify missing skills.
        </p>
      </div>

      {/* Match Configuration Form */}
      <Card title="Select Target Placement Drive">
        <form onSubmit={handleCheckMatch} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Active Resume: {resume?.fileName || 'No Resume on File'}
                </span>
                <span className="text-slate-500">
                  {resume?.skills?.length || 0} recognized skill keywords
                </span>
              </div>
            </div>
            {!resume && (
              <Link to="/student/resume">
                <Button variant="outline" size="sm">
                  Upload Resume
                </Button>
              </Link>
            )}
          </div>

          <Select
            label="Target Placement Drive"
            options={jobOptions}
            value={selectedJobId}
            onChange={(val) => setSelectedJobId(val)}
            placeholder="Select a campus placement drive..."
            required
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!selectedJobId || !resume}
              isLoading={matchMutation.isPending}
              leftIcon={Sparkles}
            >
              Check Match
            </Button>
          </div>
        </form>
      </Card>

      {/* Results View */}
      {matchResult && (
        <Card
          title="Keyword Match Results"
          subtitle={`Analysis against ${matchResult.targetJob?.title} at ${matchResult.targetJob?.companyName}`}
        >
          <div className="space-y-6 animate-in fade-in">
            {/* Big Match Score Bar */}
            <div className="p-5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 block">
                  Match Score
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Percentage of required skills found in your resume profile
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-indigo-600">
                  {matchResult.matchScore}%
                </span>
              </div>
            </div>

            {/* Matched and Missing Skills Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Matched Skills */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Matched Skills ({matchResult.matchedSkills?.length || 0})</span>
                </div>
                {matchResult.matchedSkills?.length > 0 ? (
                  <ul className="space-y-1 text-xs text-emerald-900 font-medium">
                    {matchResult.matchedSkills.map((skill, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-emerald-600">✓</span> {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No matching keywords found.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <CircleDot className="w-4 h-4 text-slate-400" />
                  <span>Missing Skills ({matchResult.missingSkills?.length || 0})</span>
                </div>
                {matchResult.missingSkills?.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {matchResult.missingSkills.map((skill, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-slate-400">•</span> {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">
                    All required keywords are present on your resume!
                  </p>
                )}
              </div>
            </div>

            {/* Mandatory Non-AI Keyword Matching Disclaimer */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block mb-0.5">Disclaimer:</span>
                These suggestions are based on keyword matching and are not a hiring decision. Recruiters evaluate complete portfolios, problem-solving ability, and academic performance.
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResumeMatcher;

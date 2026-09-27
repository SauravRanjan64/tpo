import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import adminApi from '../../services/adminApi';
import companyApi from '../../services/companyApi';
import jobApi from '../../services/jobApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Checkbox from '../../components/common/Checkbox';
import Button from '../../components/common/Button';
import { ArrowLeft, CheckCircle2, ChevronRight, Briefcase, Award } from 'lucide-react';

const jobSchema = z.object({
  companyId: z.string().min(1, 'Select a company'),
  title: z.string().min(2, 'Job title is required'),
  location: z.string().min(2, 'Job location is required'),
  jobType: z.string().min(1, 'Please select job type'),
  salaryRange: z.string().min(2, 'CTC package is required (e.g. ₹6.5–8.0 LPA)'),
  minCgpa: z.coerce.number().min(0).max(10, 'CGPA must be between 0 and 10'),
  maxBacklogs: z.coerce.number().min(0, 'Backlogs cannot be negative'),
  allowedBranches: z.array(z.string()).min(1, 'Select at least one eligible engineering branch'),
  eligibleBatch: z.coerce.number().min(2020).max(2030),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  requiredSkills: z.string().min(2, 'Enter comma-separated skills'),
  applicationStart: z.string().min(1, 'Application start date is required'),
  applicationEnd: z.string().min(1, 'Application end date is required'),
});

const ALL_BRANCHES = [
  'CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Biotechnology', 'Electrical'
];

const JOB_TYPES = [
  { value: 'Full-Time', label: 'Full-Time Placement' },
  { value: 'Internship', label: 'Internship / Pre-Placement Offer' },
  { value: 'Internship + PPO', label: '6 Months Internship + PPO' },
];

const BATCH_OPTIONS = [
  { value: '2024', label: 'Batch 2024' },
  { value: '2025', label: 'Batch 2025' },
  { value: '2026', label: 'Batch 2026' },
  { value: '2027', label: 'Batch 2027' },
];

export const CreateJobDrive = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const companiesQuery = useQuery({
    queryKey: ['admin-companies'],
    queryFn: adminApi.getCompanies,
    enabled: isAdmin,
  });
  const jobQuery = useQuery({
    queryKey: ['job-details', id],
    queryFn: () => jobApi.getJobById(id),
    enabled: Boolean(id),
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      companyId: isAdmin ? '' : 'self',
      title: '',
      location: 'Gurugram / Noida',
      jobType: 'Full-Time',
      salaryRange: '₹7.0–9.0 LPA',
      minCgpa: 7.0,
      maxBacklogs: 0,
      allowedBranches: ['CSE', 'IT', 'ECE'],
      eligibleBatch: 2025,
      description: 'We are seeking passionate engineering graduates to join our product engineering teams. You will work on cutting-edge systems and cloud deployments.',
      requiredSkills: 'React, Node.js, SQL, Data Structures',
      applicationStart: '2026-09-20',
      applicationEnd: '2026-10-05',
    },
  });

  useEffect(() => {
    if (!jobQuery.data?.job) return;
    const job = jobQuery.data.job;
    reset({
      companyId: job.companyId || '',
      title: job.title || '',
      location: job.location || '',
      jobType: job.jobType || 'Full-Time',
      salaryRange: job.salaryRange || '',
      minCgpa: job.minCgpa ?? 0,
      maxBacklogs: job.maxBacklogs ?? 0,
      allowedBranches: job.allowedBranches || [],
      eligibleBatch: job.eligibleBatches?.[0] || 2025,
      description: job.description || '',
      requiredSkills: (job.requiredSkills || []).join(', '),
      applicationStart: job.applicationStart ? new Date(job.applicationStart).toISOString().slice(0, 10) : '',
      applicationEnd: job.applicationEnd ? new Date(job.applicationEnd).toISOString().slice(0, 10) : '',
    });
  }, [jobQuery.data, reset]);

  const formValues = watch();

  const handleBranchToggle = (branch) => {
    const current = formValues.allowedBranches || [];
    if (current.includes(branch)) {
      setValue('allowedBranches', current.filter((b) => b !== branch), { shouldValidate: true });
    } else {
      setValue('allowedBranches', [...current, branch], { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const skillsArray = data.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...data,
        requiredSkills: skillsArray,
      };
      if (id) {
        await jobApi.updateJob(id, payload);
      } else if (isAdmin) {
        await adminApi.createJobDrive(payload);
      } else {
        await jobApi.createJob(payload);
      }

      const companyName = companiesQuery.data?.companies?.find(
        (company) => company.id === data.companyId
      )?.companyName || 'your company';

      showToast({
        type: 'success',
        title: id ? 'Job Drive Updated' : 'Placement Drive Published',
        message: id
          ? `${data.title} has been updated.`
          : `${data.title} for ${companyName} is now live!`,
      });
      navigate('/admin/jobs');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.message || 'Could not create placement drive.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Basic Information' },
    { num: 2, label: 'Academic Eligibility' },
    { num: 3, label: 'Job Details & Skills' },
    { num: 4, label: 'Application Period' },
    { num: 5, label: 'Review & Create' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate('/admin/jobs')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Drive Management</span>
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {id ? 'Edit Job Drive' : 'Create Placement Drive'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure visiting employer details, academic cutoffs, and application window.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 overflow-x-auto">
        {steps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setCurrentStep(s.num)}
            className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded transition-colors whitespace-nowrap ${
              currentStep === s.num
                ? 'text-indigo-600 bg-indigo-50 font-bold'
                : currentStep > s.num
                ? 'text-emerald-700'
                : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === s.num
                  ? 'bg-indigo-600 text-white'
                  : currentStep > s.num
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {currentStep > s.num ? '✓' : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION 1: Basic Information */}
        {currentStep === 1 && (
          <Card title="Section 1: Basic Information" subtitle="Employer and position fundamentals">
            <div className="space-y-4">
              {isAdmin ? (
                <Select
                  label="Company"
                  options={(companiesQuery.data?.companies || []).map((company) => ({
                    value: company.id,
                    label: company.companyName,
                  }))}
                  {...register('companyId')}
                  error={errors.companyId?.message}
                  helperText={companiesQuery.isLoading ? 'Loading companies…' : undefined}
                  required
                />
              ) : (
                <p className="text-xs text-slate-600">This Job Drive will be published under your company account.</p>
              )}
              <Input
                label="Job Designation / Title"
                {...register('title')}
                error={errors.title?.message}
                placeholder="e.g. Software Engineer / GET"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Work Location"
                  {...register('location')}
                  error={errors.location?.message}
                  placeholder="e.g. Gurugram / Noida"
                  required
                />
                <Select
                  label="Job Type"
                  options={JOB_TYPES}
                  {...register('jobType')}
                  error={errors.jobType?.message}
                  required
                />
              </div>
              <Input
                label="CTC / Compensation Package"
                {...register('salaryRange')}
                error={errors.salaryRange?.message}
                placeholder="e.g. ₹7.5–9.0 LPA"
                required
              />
            </div>
          </Card>
        )}

        {/* SECTION 2: Eligibility */}
        {currentStep === 2 && (
          <Card title="Section 2: Academic Eligibility Cutoffs" subtitle="Thresholds for automatic student validation">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Minimum CGPA (out of 10.0)"
                  type="number"
                  step="0.1"
                  {...register('minCgpa')}
                  error={errors.minCgpa?.message}
                  required
                />
                <Input
                  label="Maximum Allowed Backlogs"
                  type="number"
                  {...register('maxBacklogs')}
                  error={errors.maxBacklogs?.message}
                  required
                />
                <Select
                  label="Target Graduating Batch"
                  options={BATCH_OPTIONS}
                  {...register('eligibleBatch')}
                  error={errors.eligibleBatch?.message}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Allowed Engineering Branches *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {ALL_BRANCHES.map((br) => {
                    const isChecked = formValues.allowedBranches?.includes(br);
                    return (
                      <label key={br} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBranchToggle(br)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>{br}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.allowedBranches && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.allowedBranches.message}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* SECTION 3: Job Details */}
        {currentStep === 3 && (
          <Card title="Section 3: Job Details & Skill Requirements" subtitle="Technical keywords and job scope">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Job Description *
                </label>
                <textarea
                  rows={4}
                  {...register('description')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  placeholder="Outline responsibilities and role expectations..."
                />
                {errors.description && (
                  <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              <Input
                label="Required Skills (Comma separated)"
                {...register('requiredSkills')}
                error={errors.requiredSkills?.message}
                placeholder="e.g. React, Node.js, SQL, Express, Git"
                helperText="These keywords are used for student resume match percentage analysis"
                required
              />
            </div>
          </Card>
        )}

        {/* SECTION 4: Application Period */}
        {currentStep === 4 && (
          <Card title="Section 4: Application Window" subtitle="Registration start and submission deadline">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Application Start Date"
                type="date"
                {...register('applicationStart')}
                error={errors.applicationStart?.message}
                required
              />
              <Input
                label="Application End Date (Deadline)"
                type="date"
                {...register('applicationEnd')}
                error={errors.applicationEnd?.message}
                required
              />
            </div>
          </Card>
        )}

        {/* SECTION 5: Review */}
        {currentStep === 5 && (
          <Card title="Section 5: Final Review" subtitle="Verify parameters before publishing to university students">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Company:</span>
                <span className="font-bold text-slate-900">
                  {isAdmin
                    ? companiesQuery.data?.companies?.find((company) => company.id === formValues.companyId)?.companyName || '—'
                    : 'Your company'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Designation:</span>
                <span className="font-bold text-slate-900">{formValues.title || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Location & Type:</span>
                <span className="text-slate-800">{formValues.location} ({formValues.jobType})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">CTC Package:</span>
                <span className="font-semibold text-emerald-700">{formValues.salaryRange}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Academic Criteria:</span>
                <span className="text-slate-800 font-semibold">
                  CGPA &ge; {formValues.minCgpa} • Max Backlogs: {formValues.maxBacklogs} • Batch: {formValues.eligibleBatch}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Allowed Branches:</span>
                <span className="font-semibold text-indigo-700">
                  {formValues.allowedBranches?.join(', ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Deadline:</span>
                <span className="text-slate-800">{formValues.applicationEnd}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous Section
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCurrentStep(currentStep + 1)}
              rightIcon={ChevronRight}
            >
              Next Section
            </Button>
          ) : (
            <Button
              type="submit"
              variant="success"
              size="md"
              isLoading={isSubmitting}
              leftIcon={CheckCircle2}
            >
              {id ? 'Save Changes' : 'Create Job Drive'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateJobDrive;

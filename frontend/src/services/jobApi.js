import axiosClient from './axiosClient';

export const normalizeJob = (job) => {
  const formatLpa = (amount) => Number(amount / 100000).toFixed(1).replace(/\.0$/, '');
  const salaryValues = [job.salaryMin, job.salaryMax].filter((amount) => amount != null);

  return {
    ...job,
    companyName: job.companyName ?? job.company?.companyName,
    salaryRange: job.salaryRange ?? (salaryValues.length
      ? `${salaryValues.map(formatLpa).join('–')} LPA`
      : ''),
    allowedBranches: job.allowedBranches ?? job.branches?.map((branch) =>
      typeof branch === 'string' ? branch : branch.branch
    ) ?? [],
    requiredSkills: job.requiredSkills ?? job.skills?.map((skill) =>
      typeof skill === 'string' ? skill : skill.skill
    ) ?? [],
  };
};

export const toJobPayload = (formData) => {
  const salaryValues = String(formData.salaryRange || '')
    .match(/\d+(?:\.\d+)?/g)
    ?.map((value) => Number(value) * 100000) || [];
  if (salaryValues.length < 2) {
    throw new Error('Enter a minimum and maximum CTC in LPA.');
  }

  return {
    companyId: formData.companyId,
    title: formData.title,
    description: formData.description,
    jobType: formData.jobType,
    location: formData.location,
    salaryMin: salaryValues[0],
    salaryMax: salaryValues[1],
    minCgpa: Number(formData.minCgpa),
    maxBacklogs: Number(formData.maxBacklogs),
    eligibleBatches: [Number(formData.eligibleBatch)],
    branches: formData.allowedBranches,
    skills: Array.isArray(formData.requiredSkills)
      ? formData.requiredSkills
      : String(formData.requiredSkills || '').split(',').map((skill) => skill.trim()).filter(Boolean),
    applicationStart: new Date(`${formData.applicationStart}T00:00:00.000Z`).toISOString(),
    applicationEnd: new Date(`${formData.applicationEnd}T23:59:59.999Z`).toISOString(),
  };
};

export const jobApi = {
  getJobs: async (params = {}) => {
    const res = await axiosClient.get('/jobs', { params });
    return { ...res.data, jobs: res.data.jobs?.map(normalizeJob) || [] };
  },

  getJobById: async (id) => {
    const res = await axiosClient.get(`/jobs/${id}`);
    return { ...res.data, job: res.data.job ? normalizeJob(res.data.job) : null };
  },

  updateJob: async (id, formData) => {
    const res = await axiosClient.put(`/jobs/${id}`, toJobPayload(formData));
    return res.data;
  },

  checkEligibility: async (id) => {
    const res = await axiosClient.get(`/jobs/${id}/eligibility`);
    return res.data;
  },

  createJob: async (formData) => {
    const res = await axiosClient.post('/jobs', toJobPayload(formData));
    return res.data;
  },
};

export default jobApi;

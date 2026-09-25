import axiosClient from './axiosClient';

const normalizeJob = (job) => {
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

export const jobApi = {
  getJobs: async (params = {}) => {
    const res = await axiosClient.get('/jobs', { params });
    return { ...res.data, jobs: res.data.jobs?.map(normalizeJob) || [] };
  },

  getJobById: async (id) => {
    const res = await axiosClient.get(`/jobs/${id}`);
    return { ...res.data, job: res.data.job ? normalizeJob(res.data.job) : null };
  },

  checkEligibility: async (id) => {
    const res = await axiosClient.get(`/jobs/${id}/eligibility`);
    return res.data;
  },
};

export default jobApi;

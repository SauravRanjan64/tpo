import axiosClient from './axiosClient';
import { normalizeJob, toJobPayload } from './jobApi';

export const adminApi = {
  getStats: async () => {
    const res = await axiosClient.get('/admin/stats');
    return res.data;
  },

  getStudents: async (params = {}) => {
    const res = await axiosClient.get('/admin/students', { params });
    return res.data;
  },

  getCompanies: async () => {
    const res = await axiosClient.get('/admin/companies');
    return res.data;
  },

  verifyCompany: async (id) => {
    const res = await axiosClient.patch(`/admin/companies/${id}/verify`);
    return res.data;
  },

  getJobs: async () => {
    const res = await axiosClient.get('/admin/jobs', { params: { status: 'ALL' } });
    const jobs = res.data.jobs?.map(normalizeJob) || [];
    return { ...res.data, jobs, drives: jobs };
  },

  createJobDrive: async (data) => {
    const res = await axiosClient.post('/admin/jobs', toJobPayload(data));
    return res.data;
  },

  getApplications: async (params = {}) => {
    const res = await axiosClient.get('/admin/applications', { params });
    return res.data;
  },

  exportCsv: async (params = {}) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== 'ALL' && value !== '')
    );
    const res = await axiosClient.get('/admin/exports/csv', {
      params: filteredParams,
      responseType: 'blob',
    });
    const disposition = res.headers['content-disposition'] || '';
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || 'DCRUST_Candidates.csv';
    return { blob: res.data, filename };
  },

  updateApplicationStatus: async (applicationId, status) => {
    const res = await axiosClient.patch(`/applications/${applicationId}/status`, { status });
    return res.data;
  },

  getAuditLogs: async () => {
    const res = await axiosClient.get('/admin/audit');
    return res.data;
  },
};

export default adminApi;

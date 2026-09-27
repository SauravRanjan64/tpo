import axiosClient from './axiosClient';

export const resumeApi = {
  getResume: async () => {
    const res = await axiosClient.get('/resume');
    return res.data;
  },

  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await axiosClient.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteResume: async () => {
    const res = await axiosClient.delete('/resume');
    return res.data;
  },

  matchResume: async ({ jobId }) => {
    const res = await axiosClient.post('/resume/match', { jobId });
    return res.data;
  },
};

export default resumeApi;

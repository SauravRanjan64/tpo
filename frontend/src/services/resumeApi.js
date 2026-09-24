import axiosClient from './axiosClient';

export const resumeApi = {
  getResume: async () => {
    const res = await axiosClient.get('/resume');
    return res.data;
  },

  uploadResume: async (file, skills = []) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('skills', JSON.stringify(skills));
    const res = await axiosClient.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteResume: async () => {
    const res = await axiosClient.delete('/resume');
    return res.data;
  },

  matchResume: async ({ jobId, customSkills }) => {
    const res = await axiosClient.post('/resume/match', { jobId, customSkills });
    return res.data;
  },
};

export default resumeApi;

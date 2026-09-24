import axiosClient from './axiosClient';

export const studentApi = {
  getProfile: async () => {
    const res = await axiosClient.get('/student/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await axiosClient.put('/student/profile', data);
    return res.data;
  },

  getStats: async () => {
    const res = await axiosClient.get('/student/stats');
    return res.data;
  },
};

export default studentApi;

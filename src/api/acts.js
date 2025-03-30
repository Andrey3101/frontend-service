import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';

export const getActs = async () => {
  try {
    const response = await axios.get(`${API_URL}/acts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching acts:', error);
    throw error;
  }
};

export const updateAct = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/acts/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating act:', error);
    throw error;
  }
};

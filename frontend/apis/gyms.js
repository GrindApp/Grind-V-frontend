import axios from "axios";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const fetchGyms = async ({ page = 1, pageSize = 10, filters = {} }) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/gym`, {
      params: {
        page,
        page_size: pageSize,
        ...filters,
      },
    });
    return response?.data?.data;
  } catch (err) {
    throw err;
  }
};

export const fetchGymById = async (gymId) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/gym/${gymId}`);
    return response?.data?.data;
  } catch (err) {
    throw err;
  }
};
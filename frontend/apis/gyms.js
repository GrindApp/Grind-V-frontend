import axios from "axios";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const fetchGyms = async ({ page = 1, pageSize = 10, filters = {} }) => {
  try {
    console.log("API_URL", API_URL);
    const response = await axios.get(`${API_URL}/api/v1/gym`, {
      params: {
        page,
        page_size: pageSize,
        ...filters, // lat, lng, radius, min_rating, name, amenities etc.
      },
    });

    console.log("making gym api call", response.data.data.results);
    return response?.data?.data; // contains { count, results }
  } catch (err) {
    console.log("Error fetching gyms:", err);
    throw err;
  }
};


export const fetchGymById = async (gymId) => {
  try {
    console.log("Fetching gym by ID:", gymId);
    const response = await axios.get(`${API_URL}/api/v1/gym/${gymId}`);
    
    console.log("Gym details response:", response.data.data);
    return response?.data?.data;
  } catch (err) {
    console.log("Error fetching gym by ID:", err);
    throw err;
  }
};
import axios from "axios";
import { API_URL } from "@env";

export const fetchGyms = async () => {
  try {
    console.log("API_URL", API_URL);
    const response = await axios.get(`${API_URL}/api/v1/gym`);
    console.log("making gym api call",response.data.data.results);
    return response?.data?.data?.results;
  } catch (err) {
    console.log(err);
  }
};

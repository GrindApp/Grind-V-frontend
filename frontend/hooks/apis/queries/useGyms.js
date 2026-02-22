import { useQuery } from "@tanstack/react-query";
import { fetchGyms } from "../../../apis/gyms";

const useGyms = () => {
  const { isLoading, isError, data, error } = useQuery({
    queryKey: ["gyms"],
    queryFn: fetchGyms,
    // staleTime: 20000,
  });

  return { isLoading, isError, data, error };
};

export default useGyms;

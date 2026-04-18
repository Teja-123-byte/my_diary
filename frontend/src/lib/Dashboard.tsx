import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["test"],
    queryFn: () => apiFetch("/api/test"),
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return <h1>{data.message}</h1>;
}
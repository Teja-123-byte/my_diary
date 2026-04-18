const BASE_URL = "http://localhost:3001";

export const apiFetch = async (endpoint: string) => {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
};
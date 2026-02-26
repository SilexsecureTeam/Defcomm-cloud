import axios, { AxiosInstance } from "axios";

export const axiosClient = (
  token: string | null,
  multiMedia: boolean = false,
): AxiosInstance => {
  const contentType = multiMedia
    ? "multipart/form-data"
    : "application/json;charset=utf-8";

  const headers = {
    "Content-Type": contentType,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const client = axios.create({
    // IMPORTANT: Point this to your Vercel /api folder
    // This hides your real backend URL from the Network Tab
    baseURL: "/api/proxy/api",
    headers,
    timeout: 60000,
    withCredentials: false,
  });

  return client;
};

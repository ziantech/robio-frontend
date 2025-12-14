import axios from "axios";

let baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.romanian-biography.com/v1";

  if (
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  baseURL.startsWith("http://")
) {
  baseURL = baseURL.replace(/^http:\/\//, "https://");
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      localStorage.getItem("token")
    ) {
      console.warn("🔐 Token expired or invalid — logging out...");
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;

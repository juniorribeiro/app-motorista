import axios from "axios";

const API_URL = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para incluir o token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userId", response.data.userId);
        localStorage.setItem("userName", response.data.name);
        localStorage.setItem("userEmail", email);
        return response.data;
      }
      throw new Error("Token não recebido do servidor");
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", { name, email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
  },

  isAuthenticated: () => {
    const token = localStorage.getItem("authToken");
    return !!token;
  },

  getUserName: () => {
    return localStorage.getItem("userName");
  },

  getUserEmail: () => {
    return localStorage.getItem("userEmail");
  },
};

// Serviço para viagens
export const tripService = {
  // Adicionar nova viagem
  addTrip: async (tripData: any) => {
    const response = await api.post("/trips", tripData);
    return response.data;
  },

  // Obter todas as viagens
  getTrips: async () => {
    const response = await api.get("/trips");
    return response.data;
  },

  // Obter uma viagem específica
  getTrip: async (id: string) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  // Atualizar uma viagem
  updateTrip: async (id: string, tripData: any) => {
    const response = await api.put(`/trips/${id}`, tripData);
    return response.data;
  },

  // Excluir uma viagem
  deleteTrip: async (id: string) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },
};

// Serviço para o dashboard
export const dashboardService = {
  // Obter dados do dashboard
  getDashboardData: async (period: string = 'week') => {
    const response = await api.get(`/dashboard/summary?period=${period}`);
    return response.data;
  },
};

export default api;

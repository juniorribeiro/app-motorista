import axios from "axios";

const DEV_FALLBACK_API_URL = "http://localhost:3001/api";
export const AUTH_CHANGED_EVENT = "auth-changed";

const normalizeApiBaseUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return DEV_FALLBACK_API_URL;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const isDockerInternalHost = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ["backend", "frontend", "mysql"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
};

const resolveApiUrl = (): string => {
  if (import.meta.env.PROD) {
    return "/api";
  }

  const configuredApiUrl = import.meta.env.VITE_API_URL;
  const normalizedUrl = normalizeApiBaseUrl(configuredApiUrl || DEV_FALLBACK_API_URL);

  if (isDockerInternalHost(normalizedUrl)) {
    console.warn(
      `[api] VITE_API_URL="${configuredApiUrl}" usa hostname interno do Docker e pode falhar no navegador local. Prefira "http://localhost:3001/api".`
    );
  }

  return normalizedUrl;
};

const API_URL = resolveApiUrl();

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
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
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
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
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

export type DiaryResultEvaluation =
  | "worked_well"
  | "partially_worked"
  | "did_not_work";

export type DiaryTag =
  | "chuva"
  | "evento_na_cidade"
  | "tarifa_dinamica"
  | "horario_pico";

export interface DiaryEntryPayload {
  date: string;
  isHoliday: boolean;
  holidayName?: string;
  tags?: DiaryTag[];
  strategyHypothesis: string;
  executionNotes: string;
  resultEvaluation: DiaryResultEvaluation;
  lessonsLearned: string;
}

export interface DiaryEntry extends DiaryEntryPayload {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  year?: number;
}

export interface PaginatedDiaryResponse {
  data: DiaryEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HolidayReminder {
  id: number;
  originalDate: string;
  upcomingDate: string;
  holidayName: string;
  tags?: DiaryTag[];
  strategyHypothesis: string;
  executionNotes: string;
  resultEvaluation: DiaryResultEvaluation;
  lessonsLearned: string;
}

export const diaryService = {
  createEntry: async (payload: DiaryEntryPayload) => {
    const response = await api.post("/diary", payload);
    return response.data;
  },

  getEntries: async (params?: {
    result?: DiaryResultEvaluation;
    startDate?: string;
    endDate?: string;
    q?: string;
    tag?: DiaryTag;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await api.get("/diary", { params });
    return response.data as PaginatedDiaryResponse;
  },

  getEntryById: async (id: number) => {
    const response = await api.get(`/diary/${id}`);
    return response.data as DiaryEntry;
  },

  updateEntry: async (id: number, payload: DiaryEntryPayload) => {
    const response = await api.put(`/diary/${id}`, payload);
    return response.data;
  },

  deleteEntry: async (id: number) => {
    const response = await api.delete(`/diary/${id}`);
    return response.data;
  },

  getSameDayHistory: async () => {
    const response = await api.get("/diary/same-day-history");
    return response.data as { latest: DiaryEntry | null; entries: DiaryEntry[] };
  },

  getHolidayReminders: async (daysAhead: number = 3) => {
    const response = await api.get("/diary/holiday-reminders", {
      params: { daysAhead },
    });
    return response.data as HolidayReminder[];
  },
};

export default api;

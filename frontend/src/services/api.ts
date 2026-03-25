import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';
import type {
  LoginRequest,
  LoginResponse,
  Institution,
  CreateInstitutionRequest,
  UpdateInstitutionRequest,
  Submission,
  SubmissionStatus,
  Report,
  ReportType,
  DashboardStats,
  PaginatedResponse,
  Application,
  Registre,
  DonneeConsommer,
  DonneeFournir,
  FluxExistant,
  CasUsage,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken || originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          }, reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const newToken = response.data.token;
        useAuthStore.getState().setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  register: (data: { email: string; password: string; institutionId?: string }) =>
    api.post('/auth/register', data),

  getProfile: () =>
    api.get<{ user: LoginResponse['user'] }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ============================================================================
// INSTITUTIONS API
// ============================================================================
export const institutionsApi = {
  getAll: (params?: { search?: string; ministere?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Institution>>('/institutions', { params }),

  getOne: (id: string) =>
    api.get<Institution>(`/institutions/${id}`),

  create: (data: CreateInstitutionRequest) =>
    api.post<Institution>('/institutions', data),

  update: (id: string, data: UpdateInstitutionRequest) =>
    api.patch<Institution>(`/institutions/${id}`, data),

  delete: (id: string) =>
    api.delete(`/institutions/${id}`),

  getStats: () =>
    api.get<{ total: number; byMinistere: Record<string, number> }>('/institutions/stats'),
};

// ============================================================================
// SUBMISSIONS API
// ============================================================================
export const submissionsApi = {
  getAll: (params?: {
    status?: SubmissionStatus;
    institutionId?: string;
    page?: number;
    limit?: number
  }) =>
    api.get<PaginatedResponse<Submission>>('/submissions', { params }),

  getOne: (id: string) =>
    api.get<Submission>(`/submissions/${id}`),

  create: (institutionId: string) =>
    api.post<Submission>('/submissions', { institutionId }),

  update: (id: string, data: Partial<Submission>) =>
    api.patch<Submission>(`/submissions/${id}`, data),

  updateStatus: (id: string, status: SubmissionStatus) =>
    api.patch<Submission>(`/submissions/${id}/status`, { status }),

  submit: (id: string) =>
    api.post<Submission>(`/submissions/${id}/submit`),

  delete: (id: string) =>
    api.delete(`/submissions/${id}`),

  getStats: () =>
    api.get<{ total: number; byStatus: Record<SubmissionStatus, number> }>('/submissions/stats'),

  // Sub-entities
  addApplication: (submissionId: string, data: Omit<Application, 'id' | 'submissionId' | 'createdAt'>) =>
    api.post<Application>(`/submissions/${submissionId}/applications`, data),

  updateApplication: (submissionId: string, appId: string, data: Partial<Application>) =>
    api.patch<Application>(`/submissions/${submissionId}/applications/${appId}`, data),

  deleteApplication: (submissionId: string, appId: string) =>
    api.delete(`/submissions/${submissionId}/applications/${appId}`),

  addRegistre: (submissionId: string, data: Omit<Registre, 'id' | 'submissionId' | 'createdAt'>) =>
    api.post<Registre>(`/submissions/${submissionId}/registres`, data),

  updateRegistre: (submissionId: string, regId: string, data: Partial<Registre>) =>
    api.patch<Registre>(`/submissions/${submissionId}/registres/${regId}`, data),

  deleteRegistre: (submissionId: string, regId: string) =>
    api.delete(`/submissions/${submissionId}/registres/${regId}`),

  addDonneeConsommer: (submissionId: string, data: Omit<DonneeConsommer, 'id' | 'submissionId' | 'createdAt'>) =>
    api.post<DonneeConsommer>(`/submissions/${submissionId}/donnees-consommer`, data),

  deleteDonneeConsommer: (submissionId: string, dcId: string) =>
    api.delete(`/submissions/${submissionId}/donnees-consommer/${dcId}`),

  addDonneeFournir: (submissionId: string, data: Omit<DonneeFournir, 'id' | 'submissionId' | 'createdAt'>) =>
    api.post<DonneeFournir>(`/submissions/${submissionId}/donnees-fournir`, data),

  deleteDonneeFournir: (submissionId: string, dfId: string) =>
    api.delete(`/submissions/${submissionId}/donnees-fournir/${dfId}`),

  addFluxExistant: (submissionId: string, data: Omit<FluxExistant, 'id' | 'submissionId' | 'createdAt'>) =>
    api.post<FluxExistant>(`/submissions/${submissionId}/flux-existants`, data),

  deleteFluxExistant: (submissionId: string, feId: string) =>
    api.delete(`/submissions/${submissionId}/flux-existants/${feId}`),

  addCasUsage: (submissionId: string, data: Omit<CasUsage, 'id' | 'submissionId' | 'createdAt'>) =>
    api.post<CasUsage>(`/submissions/${submissionId}/cas-usage`, data),

  deleteCasUsage: (submissionId: string, cuId: string) =>
    api.delete(`/submissions/${submissionId}/cas-usage/${cuId}`),

  // Infrastructure items
  updateInfrastructureItems: (submissionId: string, items: any[]) =>
    api.put(`/submissions/${submissionId}/infrastructure`, items),

  // Framework interopérabilité
  updateNiveauxInterop: (submissionId: string, items: any[]) =>
    api.put(`/submissions/${submissionId}/niveaux-interop`, items),

  updateConformitePrincipes: (submissionId: string, items: any[]) =>
    api.put(`/submissions/${submissionId}/conformite-principes`, items),

  updateDictionnaire: (submissionId: string, items: any[]) =>
    api.put(`/submissions/${submissionId}/dictionnaire`, items),

  updatePreparationDecret: (submissionId: string, items: any[]) =>
    api.put(`/submissions/${submissionId}/preparation-decret`, items),

  // FluxInstitution (registre unique)
  getFluxInstitution: (submissionId: string) =>
    api.get(`/flux-institutions/submission/${submissionId}`),

  getAvailableFlux: (institutionCode: string) =>
    api.get(`/flux-institutions/available/${institutionCode}`),

  updateFluxInstitution: (submissionId: string, items: any[]) =>
    api.put(`/flux-institutions/submission/${submissionId}`, items),

  proposeFlux: (data: any) =>
    api.post('/flux-institutions/propose', data),
};

// ============================================================================
// REPORTS API
// ============================================================================
export const reportsApi = {
  getAll: (params?: { type?: ReportType; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Report>>('/reports', { params }),

  getOne: (id: string) =>
    api.get<Report>(`/reports/${id}`),

  generate: (data: {
    type: ReportType;
    format?: 'PDF' | 'CSV' | 'XLSX' | 'JSON';
    institutionId?: string;
    filters?: Record<string, unknown>;
  }) => api.post<Report>('/reports/generate', data),

  download: (id: string) =>
    api.get(`/reports/${id}/download`, { responseType: 'blob' }),

  delete: (id: string) =>
    api.delete(`/reports/${id}`),
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================
export const notificationsApi = {
  invite: (institutionId: string) =>
    api.post(`/notifications/invite/${institutionId}`),

  relance: (institutionId: string) =>
    api.post(`/notifications/relance/${institutionId}`),

  inviteAll: () =>
    api.post('/notifications/invite-all'),
};

// ============================================================================
// DASHBOARD API
// ============================================================================
export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard/stats'),

  getRecentActivity: (limit?: number) =>
    api.get<{ submissions: Submission[] }>('/dashboard/recent', { params: { limit } }),
};

// ============================================================================
// EXPORT ALL
// ============================================================================
export default api;

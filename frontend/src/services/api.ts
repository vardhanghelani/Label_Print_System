import type {
  Template,
  Layout,
  Label,
  PrintJob,
  PreviewData,
  CalibrationSettings,
  PrintMode,
  ShopSettings,
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface PrintJobPreviewPayload {
  templateId: string;
  layoutId: string;
  labelIds: string[];
  mode: PrintMode;
  selectedPositions: number[];
  startFromPosition?: number;
  usedPositions: number[];
  status?: PrintJob['status'];
}

export const api = {
  templates: {
    list: () => request<Template[]>('/templates'),
    get: (id: string) => request<Template>(`/templates/${id}`),
    create: (data: Partial<Template>) =>
      request<Template>('/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Template>) =>
      request<Template>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/templates/${id}`, { method: 'DELETE' }),
  },

  layouts: {
    list: (templateId?: string) =>
      request<Layout[]>(templateId ? `/layouts?templateId=${templateId}` : '/layouts'),
    get: (id: string) => request<Layout>(`/layouts/${id}`),
    create: (data: Partial<Layout>) =>
      request<Layout>('/layouts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Layout>) =>
      request<Layout>(`/layouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/layouts/${id}`, { method: 'DELETE' }),
  },

  labels: {
    list: () => request<Label[]>('/labels'),
    get: (id: string) => request<Label>(`/labels/${id}`),
    create: (data: Partial<Label>) =>
      request<Label>('/labels', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Label>) =>
      request<Label>(`/labels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/labels/${id}`, { method: 'DELETE' }),
  },

  printJobs: {
    history: () => request<PrintJob[]>('/print-jobs/history'),
    preview: (data: PrintJobPreviewPayload) =>
      request<PreviewData>('/print-jobs/preview', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    create: (data: PrintJobPreviewPayload) =>
      request<PrintJob>('/print-jobs', { method: 'POST', body: JSON.stringify(data) }),
  },

  settings: {
    getCalibration: () => request<CalibrationSettings>('/settings/calibration'),
    updateCalibration: (data: CalibrationSettings) =>
      request<CalibrationSettings>('/settings/calibration', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getShop: () => request<ShopSettings>('/settings/shop'),
    updateShop: (data: ShopSettings) =>
      request<ShopSettings>('/settings/shop', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getAdminStatus: () => request<{ passwordSet: boolean }>('/settings/admin/status'),
    setupAdmin: (password: string) =>
      request<{ success: boolean }>('/settings/admin/setup', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    verifyAdmin: (password: string) =>
      request<{ valid: boolean }>('/settings/admin/verify', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
  },
};

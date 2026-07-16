import { apiBlobRequest, apiRequest } from './apiClient';

export type StoredDocument = {
  id: string;
  name: string;
  type: string;
  category: string;
  updated: string;
  usedIn: number;
  size: string;
  url: string;
  language?: string | null;
  targetRole?: string | null;
  fileName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  usedInApplicationsCount?: number;
  assignedApplications?: string[];
  tags?: string[];
  status?: 'Active' | 'Archived';
  notes?: string | null;
  successRate?: number;
  lastUsedAt?: string | null;
  isDefault?: boolean;
};

export type DocumentId = string | number;

export type DocumentUploadInput = {
  file: File;
  type?: string;
  category?: string;
  language?: string;
  targetRole?: string;
  notes?: string;
  tags?: string[];
};

export type DocumentLinkInput = {
  name: string;
  url: string;
  type?: string;
  category?: string;
  notes?: string;
  tags?: string[];
};

const toFormData = (input: DocumentUploadInput) => {
  const formData = new FormData();
  formData.append('file', input.file);

  if (input.type) formData.append('type', input.type);
  if (input.category) formData.append('category', input.category);
  if (input.language) formData.append('language', input.language);
  if (input.targetRole) formData.append('targetRole', input.targetRole);
  if (input.notes) formData.append('notes', input.notes);
  if (input.tags?.length) formData.append('tags', input.tags.join(', '));

  return formData;
};

export const documentsApi = {
  async getAll() {
    return apiRequest<StoredDocument[]>('/api/documents');
  },

  async upload(input: DocumentUploadInput) {
    return apiRequest<StoredDocument>('/api/documents/upload', {
      method: 'POST',
      body: toFormData(input)
    });
  },

  async createLink(input: DocumentLinkInput) {
    return apiRequest<StoredDocument>('/api/documents/links', {
      method: 'POST',
      body: {
        ...input,
        tags: input.tags?.join(', ') ?? ''
      }
    });
  },

  async archive(id: DocumentId) {
    return apiRequest<StoredDocument>(`/api/documents/${id}/archive`, {
      method: 'PUT'
    });
  },

  async download(id: DocumentId) {
    return apiBlobRequest(`/api/documents/${id}/download`);
  },

  async remove(id: DocumentId) {
    await apiRequest<void>(`/api/documents/${id}`, {
      method: 'DELETE'
    });
  }
};

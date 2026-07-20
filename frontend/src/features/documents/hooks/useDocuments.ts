import { useCallback, useEffect, useState } from 'react';
import { documentsApi, type DocumentId, type DocumentLinkInput, type StoredDocument } from '../../../api/documentsApi';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while loading documents.';
};

const startBrowserDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function useDocuments(enabled = true) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!enabled) {
      setDocuments([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setDocuments(await documentsApi.getAll());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const uploadDocument = useCallback(async (file: File) => {
    setSaving(true);
    setError(null);

    try {
      const created = await documentsApi.upload({ file });
      setDocuments((current) => [created, ...current]);
      return created;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const createLink = useCallback(async (input: DocumentLinkInput) => {
    setSaving(true);
    setError(null);

    try {
      const created = await documentsApi.createLink(input);
      setDocuments((current) => [created, ...current]);
      return created;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const archiveDocument = useCallback(async (id: DocumentId) => {
    setSaving(true);
    setError(null);

    try {
      const archived = await documentsApi.archive(id);
      setDocuments((current) => current.map((document) => (document.id === id ? archived : document)));
      return archived;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateDocumentTitle = useCallback(async (id: DocumentId, name: string) => {
    setSaving(true);
    setError(null);

    try {
      const updated = await documentsApi.update(id, { name });
      setDocuments((current) => current.map((document) => (document.id === id ? updated : document)));
      return updated;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: DocumentId) => {
    setSaving(true);
    setError(null);

    try {
      await documentsApi.remove(id);
      setDocuments((current) => current.filter((document) => document.id !== id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const downloadDocument = useCallback(async (document: StoredDocument) => {
    setSaving(true);
    setError(null);

    try {
      const blob = await documentsApi.download(document.id);
      startBrowserDownload(blob, document.fileName || document.name);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const createDocumentPreviewUrl = useCallback(async (document: StoredDocument) => {
    setSaving(true);
    setError(null);

    try {
      const blob = await documentsApi.download(document.id);
      return URL.createObjectURL(blob);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    documents,
    loading,
    saving,
    error,
    loadDocuments,
    uploadDocument,
    createLink,
    archiveDocument,
    updateDocumentTitle,
    deleteDocument,
    downloadDocument,
    createDocumentPreviewUrl
  };
}

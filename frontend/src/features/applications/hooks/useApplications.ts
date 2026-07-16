import { useCallback, useEffect, useState } from 'react';
import { applicationsApi, type ApplicationUpsertInput } from '../../../api/applicationsApi';
import type { ApplicationId, ApplicationStatus, JobApplication } from '../../../types';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while loading applications.';
};

export function useApplications(enabled = true) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!enabled) {
      setApplications([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await applicationsApi.getAll();
      setApplications(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      void loadApplications();
    }
  }, [enabled, loadApplications]);

  const createApplication = useCallback(async (application: ApplicationUpsertInput) => {
    setSaving(true);
    setError(null);

    try {
      const created = await applicationsApi.create(application);
      setApplications((current) => [created, ...current]);
      return created;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateApplication = useCallback(async (id: ApplicationId, application: ApplicationUpsertInput) => {
    setSaving(true);
    setError(null);

    try {
      await applicationsApi.update(id, application);
      const updated = await applicationsApi.getById(id);
      setApplications((current) => current.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteApplication = useCallback(async (id: ApplicationId) => {
    setSaving(true);
    setError(null);

    try {
      await applicationsApi.remove(id);
      setApplications((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (application: JobApplication, status: ApplicationStatus) => {
      return updateApplication(application.id, { ...application, status });
    },
    [updateApplication]
  );

  return {
    applications,
    loading,
    saving,
    error,
    loadApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    updateStatus
  };
}

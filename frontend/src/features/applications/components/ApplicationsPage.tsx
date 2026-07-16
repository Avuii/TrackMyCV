import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, RefreshCw, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../api/apiClient';
import type { ApplicationUpsertInput } from '../../../api/applicationsApi';
import { ApplicationsStateMessage, PageTitle } from '../../../components/ui';
import { useApplications } from '../hooks/useApplications';
import type { ApplicationId, ApplicationStatus, JobApplication } from '../../../types';
import { ApplicationDetailsModal } from './ApplicationDetailsModal';
import { ApplicationFormModal } from './ApplicationFormModal';
import { ApplicationsTable } from './ApplicationsTable';

export function ApplicationsPage({ showHeader = true, createSignal = 0 }: { showHeader?: boolean; createSignal?: number }) {
  const {
    applications,
    loading,
    saving,
    error,
    loadApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    updateStatus
  } = useApplications();
  const [search, setSearch] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState<ApplicationId | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return applications;
    }

    return applications.filter((application) =>
      [application.company, application.position, application.status, application.location, application.source]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [applications, search]);

  useEffect(() => {
    if (selectedApplicationId === null) {
      return;
    }

    if (!applications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(null);
      setDetailsOpen(false);
    }
  }, [applications, selectedApplicationId]);

  const selectedApplication = applications.find((application) => application.id === selectedApplicationId) ?? null;

  const openCreateModal = () => {
    setFormError(null);
    setEditingApplication(null);
    setDetailsOpen(false);
    setModalMode('create');
  };

  useEffect(() => {
    if (createSignal > 0) {
      openCreateModal();
    }
  }, [createSignal]);

  const openEditModal = (application: JobApplication) => {
    setFormError(null);
    setEditingApplication(application);
    setDetailsOpen(false);
    setModalMode('edit');
  };

  const openDetailsModal = (application: JobApplication) => {
    setSelectedApplicationId(application.id);
    setDetailsOpen(true);
  };

  const closeModal = () => {
    setFormError(null);
    setEditingApplication(null);
    setModalMode(null);
  };

  const handleSubmit = async (application: ApplicationUpsertInput) => {
    try {
      if (modalMode === 'create') {
        const created = await createApplication(application);
        setSelectedApplicationId(created.id);
      } else if (editingApplication) {
        const updated = await updateApplication(editingApplication.id, application);
        setSelectedApplicationId(updated.id);
      }

      closeModal();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Could not save application.');
    }
  };

  const handleDelete = async (application: JobApplication) => {
    const confirmed = window.confirm(`Delete application for ${application.company}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteApplication(application.id);
      if (selectedApplicationId === application.id) {
        setSelectedApplicationId(null);
        setDetailsOpen(false);
      }
    } catch {
      // Error state is handled by the hook and displayed below the table.
    }
  };

  const handleStatusChange = async (application: JobApplication, status: ApplicationStatus) => {
    try {
      const updated = await updateStatus(application, status);
      setSelectedApplicationId(updated.id);
    } catch {
      // Error state is handled by the hook and displayed below the table.
    }
  };

  return (
    <section className="page-section api-applications-page">
      {showHeader ? <PageTitle title="Applications" subtitle={`Connected to ${API_BASE_URL}.`} /> : null}
      <div className="toolbar">
        <div className="search-field wide">
          <Search size={18} />
          <input value={search} placeholder="Search company, position..." onChange={(event) => setSearch(event.target.value)} />
        </div>
        <button className="secondary-button" type="button" onClick={loadApplications}>
          <RefreshCw size={17} /> Refresh
        </button>
        <button className="secondary-button" type="button">
          <Download size={17} /> Export
        </button>
        <button className="primary-button" type="button" onClick={openCreateModal}>
          <Plus size={17} /> Add application
        </button>
      </div>
      <section className="panel-card applications-panel">
        {loading ? (
          <ApplicationsStateMessage title="Loading applications" text="Fetching applications from the API." />
        ) : error && applications.length === 0 ? (
          <ApplicationsStateMessage title="Could not load applications" text={error} actionLabel="Retry API" onAction={loadApplications} />
        ) : visibleApplications.length === 0 ? (
          <ApplicationsStateMessage
            title={search ? 'No matching applications' : 'No applications yet'}
            text={search ? 'Clear the search or refresh data from the API.' : 'Add your first application to start tracking the process.'}
            actionLabel={search ? 'Refresh API' : 'Add application'}
            onAction={search ? loadApplications : openCreateModal}
          />
        ) : (
          <ApplicationsTable
            applications={visibleApplications}
            selectedId={selectedApplicationId}
            onSelect={openDetailsModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </section>
      {error && applications.length > 0 ? (
        <section className="panel-card details-panel">
          <ApplicationsStateMessage title="API action failed" text={error} actionLabel="Retry API" onAction={loadApplications} />
        </section>
      ) : null}
      {detailsOpen && selectedApplication ? (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setDetailsOpen(false)}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ) : null}
      {modalMode ? (
        <ApplicationFormModal
          mode={modalMode}
          application={editingApplication}
          saving={saving}
          error={formError}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  );
}

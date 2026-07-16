import { X } from 'lucide-react';
import type { ApplicationStatus, JobApplication } from '../../../types';
import { ApplicationDetailsPanel } from './ApplicationDetailsPanel';

export function ApplicationDetailsModal({
  application,
  onClose,
  onEdit,
  onDelete,
  onStatusChange
}: {
  application: JobApplication;
  onClose: () => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: ApplicationStatus) => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="settings-modal application-details-modal" role="dialog" aria-modal="true" aria-label={`${application.company} application details`}>
        <header className="modal-header">
          <div>
            <h2>Application details</h2>
            <p>{application.company} - {application.position}</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close application details">
            <X size={20} />
          </button>
        </header>
        <main className="modal-content custom-scroll">
          <ApplicationDetailsPanel
            application={application}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        </main>
      </section>
    </div>
  );
}

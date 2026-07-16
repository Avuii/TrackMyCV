import { Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '../../../components/ui';
import type { ApplicationId, JobApplication } from '../../../types';

export function ApplicationsTable({
  applications,
  selectedId,
  onSelect,
  onEdit,
  onDelete
}: {
  applications: JobApplication[];
  selectedId: ApplicationId | null;
  onSelect: (application: JobApplication) => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="applications-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Position</th>
            <th>Status</th>
            <th>Date applied</th>
            <th>Next step</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              key={application.id}
              className={selectedId === application.id ? 'selected-row' : ''}
              onClick={() => onSelect(application)}
            >
              <td>
                <div className="company-cell">
                  <span className="company-logo">{application.company[0] || '?'}</span>
                  <div>
                    <strong>{application.company}</strong>
                    <small>{application.location || '-'}</small>
                  </div>
                </div>
              </td>
              <td>
                <div className="position-cell">
                  <strong>{application.position}</strong>
                  <small>{application.workMode} - {application.source || '-'}</small>
                </div>
              </td>
              <td><StatusBadge status={application.status} /></td>
              <td>{application.dateApplied || '-'}</td>
              <td>{application.nextStep || '-'}</td>
              <td>
                <div className="document-actions">
                  <button className="ghost-icon" type="button" aria-label="Edit application" onClick={(event) => { event.stopPropagation(); onEdit(application); }}>
                    <Pencil size={17} />
                  </button>
                  <button className="ghost-icon danger" type="button" aria-label="Delete application" onClick={(event) => { event.stopPropagation(); onDelete(application); }}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { applicationStatusOptions } from '../../../api/applicationsApi';
import { InfoList, StatusBadge } from '../../../components/ui';
import type { ApplicationStatus, JobApplication } from '../../../types';

const compactList = (items: Array<string | number | null | undefined>) =>
  items
    .map((item) => (item === null || item === undefined ? '' : String(item)))
    .filter(Boolean);

const getSalaryRange = (application: JobApplication) => {
  if (!application.salaryMin && !application.salaryMax) {
    return 'Not provided';
  }

  const currency = application.currency ?? 'PLN';
  const min = application.salaryMin ? application.salaryMin.toLocaleString('en-US') : '?';
  const max = application.salaryMax ? application.salaryMax.toLocaleString('en-US') : '?';

  return `${min}-${max} ${currency}`;
};

export function ApplicationDetailsPanel({
  application,
  onEdit,
  onDelete,
  onStatusChange
}: {
  application: JobApplication;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: ApplicationStatus) => void;
}) {
  const openOffer = () => {
    if (application.offerUrl) {
      window.open(application.offerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const match = application.skillMatch;

  return (
    <div className="application-details-grid">
      <section className="application-details-summary">
        <div className="details-heading">
          <span className="company-logo large">{application.company[0] || '?'}</span>
          <div>
            <h2>{application.company}</h2>
            <p>{application.position}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
        <div className="details-actions">
          <button className="secondary-button" type="button" onClick={openOffer} disabled={!application.offerUrl}>
            <ExternalLink size={17} /> Open offer
          </button>
          <button className="secondary-button" type="button" onClick={() => onEdit(application)}>
            <Pencil size={17} /> Edit
          </button>
          <button className="secondary-button danger-action" type="button" onClick={() => onDelete(application)}>
            <Trash2 size={17} /> Delete
          </button>
        </div>
        <div className="setting-group compact-setting">
          <span className="setting-label">Change status</span>
          <div className="token-row compact-tokens">
            {applicationStatusOptions.map((status) => (
              <button className={application.status === status ? 'selected' : ''} type="button" key={status} onClick={() => onStatusChange(application, status)}>
                {status}
              </button>
            ))}
          </div>
        </div>
      </section>
      <InfoList title="Requirements" items={application.requirements} />
      <InfoList title="Benefits" items={application.benefits} />
      <InfoList
        title="Details"
        items={compactList([
          application.location,
          application.workMode,
          application.source,
          application.category,
          application.level,
          application.cv
        ])}
      />
      <InfoList
        title="Status history / Timeline"
        items={compactList([
          `Applied: ${application.dateApplied || '-'}`,
          `Last contact: ${application.lastContact || '-'}`,
          `Next step: ${application.nextStep || '-'}`
        ])}
      />
      {match ? (
        <section className="info-list cv-match-card">
          <h3>CV Match</h3>
          <div className="match-score-row">
            <strong>{match.matchScore}%</strong>
            <div><span style={{ width: `${match.matchScore}%` }} /></div>
          </div>
          <InfoList title="Required skills" items={match.requiredSkills} />
          <InfoList title="Matched skills" items={match.matchedSkills} />
          <InfoList title="Missing skills" items={match.missingSkills} />
        </section>
      ) : null}
      <InfoList title="Salary and contract" items={compactList([getSalaryRange(application), application.contractType])} />
      <InfoList title="Offer archive" items={compactList([application.offerUrl || 'No URL', application.savedJobDescription || 'No saved description'])} />
      <InfoList title="Tech stack" items={application.techStack ?? []} />
      <InfoList title="Notes" items={[application.notes || 'No notes yet']} />
    </div>
  );
}

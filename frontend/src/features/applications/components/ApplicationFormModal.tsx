import { useState, type FormEvent } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { applicationStatusOptions, toDateInputValue, workModeOptions, type ApplicationUpsertInput } from '../../../api/applicationsApi';
import { ApplicationFormInput, SelectionTokenGroup } from '../../../components/ui';
import type { ApplicationStatus, JobApplication, WorkMode } from '../../../types';

type ApplicationFormState = {
  companyId: string | null;
  company: string;
  position: string;
  category: string;
  level: string;
  status: ApplicationStatus;
  dateApplied: string;
  lastContact: string;
  nextStep: string;
  location: string;
  workMode: WorkMode;
  source: string;
  requirements: string;
  benefits: string;
  notes: string;
  offerUrl: string;
  cv: string;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const emptyApplicationForm = (): ApplicationFormState => ({
  companyId: null,
  company: '',
  position: '',
  category: '',
  level: '',
  status: 'Saved',
  dateApplied: todayInputValue(),
  lastContact: '',
  nextStep: '',
  location: '',
  workMode: 'Remote',
  source: '',
  requirements: '',
  benefits: '',
  notes: '',
  offerUrl: '',
  cv: ''
});

const applicationToFormState = (application: JobApplication | null): ApplicationFormState => {
  if (!application) {
    return emptyApplicationForm();
  }

  return {
    companyId: application.companyId ?? null,
    company: application.company,
    position: application.position,
    category: application.category,
    level: application.level,
    status: application.status,
    dateApplied: toDateInputValue(application.dateApplied),
    lastContact: toDateInputValue(application.lastContact),
    nextStep: application.nextStep,
    location: application.location,
    workMode: application.workMode,
    source: application.source,
    requirements: application.requirements.join(', '),
    benefits: application.benefits.join(', '),
    notes: application.notes,
    offerUrl: application.offerUrl,
    cv: application.cv
  };
};

const splitFormList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const formStateToApplication = (form: ApplicationFormState): ApplicationUpsertInput => ({
  companyId: form.companyId,
  company: form.company.trim(),
  position: form.position.trim(),
  category: form.category.trim(),
  level: form.level.trim(),
  status: form.status,
  dateApplied: form.dateApplied,
  lastContact: form.lastContact,
  nextStep: form.nextStep.trim(),
  location: form.location.trim(),
  workMode: form.workMode,
  source: form.source.trim(),
  requirements: splitFormList(form.requirements),
  benefits: splitFormList(form.benefits),
  notes: form.notes.trim(),
  offerUrl: form.offerUrl.trim(),
  cv: form.cv.trim()
});

export function ApplicationFormModal({
  mode,
  application,
  saving,
  error,
  onClose,
  onSubmit
}: {
  mode: 'create' | 'edit';
  application: JobApplication | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (application: ApplicationUpsertInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ApplicationFormState>(() => applicationToFormState(application));
  const title = mode === 'create' ? 'Add application' : 'Edit application';

  const updateField = <T extends keyof ApplicationFormState>(field: T, value: ApplicationFormState[T]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(formStateToApplication(form));
  };

  return (
    <div className="modal-backdrop">
      <form className="settings-modal" role="dialog" aria-modal="true" aria-label={title} onSubmit={handleSubmit}>
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{mode === 'create' ? 'Create a new tracked application.' : 'Update application details and status.'}</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close application form">
            <X size={20} />
          </button>
        </header>
        <main className="modal-content custom-scroll">
          {error ? (
            <div className="setting-group">
              <span className="setting-label">Error</span>
              <p>{error}</p>
            </div>
          ) : null}
          <div className="form-grid">
            <ApplicationFormInput label="Company" value={form.company} onChange={(value) => updateField('company', value)} required />
            <ApplicationFormInput label="Position" value={form.position} onChange={(value) => updateField('position', value)} required />
            <ApplicationFormInput label="Category" value={form.category} onChange={(value) => updateField('category', value)} />
            <ApplicationFormInput label="Level" value={form.level} onChange={(value) => updateField('level', value)} />
            <ApplicationFormInput label="Date applied" type="date" value={form.dateApplied} onChange={(value) => updateField('dateApplied', value)} required />
            <ApplicationFormInput label="Last contact" type="date" value={form.lastContact} onChange={(value) => updateField('lastContact', value)} />
            <ApplicationFormInput label="Next step" value={form.nextStep} onChange={(value) => updateField('nextStep', value)} />
            <ApplicationFormInput label="Location" value={form.location} onChange={(value) => updateField('location', value)} />
            <ApplicationFormInput label="Source" value={form.source} onChange={(value) => updateField('source', value)} />
            <ApplicationFormInput label="CV" value={form.cv} onChange={(value) => updateField('cv', value)} />
            <ApplicationFormInput label="Offer URL" value={form.offerUrl} onChange={(value) => updateField('offerUrl', value)} />
            <ApplicationFormInput label="Requirements" value={form.requirements} onChange={(value) => updateField('requirements', value)} />
            <ApplicationFormInput label="Benefits" value={form.benefits} onChange={(value) => updateField('benefits', value)} />
            <ApplicationFormInput label="Notes" value={form.notes} onChange={(value) => updateField('notes', value)} />
          </div>
          <SelectionTokenGroup
            title="Status"
            tokens={applicationStatusOptions}
            selected={form.status}
            onSelect={(status) => updateField('status', status)}
          />
          <SelectionTokenGroup
            title="Work mode"
            tokens={workModeOptions}
            selected={form.workMode}
            onSelect={(workMode) => updateField('workMode', workMode)}
          />
        </main>
        <footer className="modal-footer">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="submit" disabled={saving}>
            <CheckCircle2 size={17} /> {saving ? 'Saving...' : 'Save application'}
          </button>
        </footer>
      </form>
    </div>
  );
}

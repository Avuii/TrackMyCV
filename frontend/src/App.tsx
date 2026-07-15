import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Folder,
  Globe,
  Heart,
  LayoutDashboard,
  Link,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Pencil,
  PieChart,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Sun,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Video,
  X,
  XCircle
} from 'lucide-react';
import { applications, companies, documents, notes, upcomingEvents } from './mockData';
import {
  applicationStatusOptions,
  toDateInputValue,
  workModeOptions,
  type ApplicationUpsertInput
} from './api/applicationsApi';
import { useApplications } from './features/applications/hooks/useApplications';
import type { ApplicationId, ApplicationStatus, JobApplication, Page, WorkMode } from './types';

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', icon: BriefcaseBusiness, badge: 10 },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, badge: 3 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote }
];

const statusClass = (status: string) =>
  status
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('/', '')
    .replaceAll('—', '')
    .replaceAll('received', 'received');

function Logo() {
  return (
    <div className="brand">
      <div className="brand-icon" aria-hidden="true">
        <Folder size={24} strokeWidth={1.8} />
        <Search className="brand-search" size={15} strokeWidth={2} />
      </div>
      <div>
        <div className="brand-name">ApplyFlow</div>
        <div className="brand-subtitle">Job Tracker</div>
      </div>
    </div>
  );
}

function Sidebar({ currentPage, onPageChange }: { currentPage: Page; onPageChange: (page: Page) => void }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === currentPage;
          return (
            <button
              className={`nav-item ${isActive ? 'active' : ''}`}
              key={item.id}
              onClick={() => onPageChange(item.id)}
              type="button"
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-card">
        <div className="desk-card-image">
          <div className="desk-card-laptop" />
          <div className="desk-card-cup" />
          <div className="desk-card-vase" />
        </div>
        <h3>Stay consistent</h3>
        <p>Small steps every day lead to big changes.</p>
        <Heart size={18} strokeWidth={1.7} />
      </div>
    </aside>
  );
}

function Topbar({
  title,
  subtitle,
  theme,
  setTheme,
  onOpenSettings
}: {
  title: string;
  subtitle: string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onOpenSettings: () => void;
}) {
  const [openProfile, setOpenProfile] = useState(false);

  const openCustomization = () => {
    setOpenProfile(false);
    onOpenSettings();
  };

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Search">
          <Search size={19} />
        </button>
        <button className="icon-button with-dot" type="button" aria-label="Notifications">
          <Bell size={19} />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <div className="profile-wrap">
          <button className={`profile-button ${openProfile ? 'open' : ''}`} type="button" onClick={() => setOpenProfile((value) => !value)}>
            <span className="avatar-soft">
              <User size={18} />
            </span>
            <span>Kasia</span>
            <ChevronDown size={16} className={openProfile ? 'rotated' : ''} />
          </button>
          {openProfile ? (
            <div className="profile-menu">
              <div className="profile-menu-header">
                <strong>Kasia Wiśniewska</strong>
                <span>kasia@example.com</span>
              </div>
              <button type="button" onClick={openCustomization}>
                <User size={17} /> Profile
              </button>
              <button type="button" onClick={openCustomization}>
                <Palette size={17} /> Appearance
              </button>
              <button type="button" onClick={openCustomization}>
                <Bell size={17} /> Notifications
              </button>
              <button type="button" onClick={openCustomization}>
                <SlidersHorizontal size={17} /> Preferences
              </button>
              <button type="button" onClick={openCustomization}>
                <Download size={17} /> Data & export
              </button>
              <button type="button" className="danger-link">
                <LogOut size={17} /> Log out
              </button>
            </div>
          ) : null}
        </div>
        <button className="primary-button" type="button">
          <Plus size={18} /> Add application
        </button>
        <button className="secondary-button" type="button">
          <Filter size={18} /> Filter
        </button>
      </div>
    </header>
  );
}

function MetricCard({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone?: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${statusClass(status)}`}>{status}</span>;
}

function CategoryPill({ category }: { category: string }) {
  return <span className="category-pill">{category}</span>;
}

function ApplicationSummary() {
  const summary = [
    ['Applied', 6, 'summary-applied'],
    ['In progress', 3, 'summary-progress'],
    ['Interview', 2, 'summary-interview'],
    ['Rejected', 4, 'summary-rejected'],
    ['No response', 2, 'summary-no-response'],
    ['Ghosted', 1, 'summary-ghosted'],
    ['Offer', 1, 'summary-offer']
  ] as const;

  return (
    <section className="panel-card summary-card">
      <div className="card-header compact">
        <div>
          <h2>Application summary</h2>
          <p>19 total applications</p>
        </div>
      </div>
      <div className="donut-wrap">
        <div className="donut-chart">
          <div>
            <strong>19</strong>
            <span>applications</span>
          </div>
        </div>
        <div className="summary-list">
          {summary.map(([label, count, color]) => (
            <div className="summary-row" key={label}>
              <span className={`summary-dot ${color}`} />
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuccessRateCard() {
  return (
    <section className="panel-card success-card">
      <h2>Success rate</h2>
      <p>Interviews secured</p>
      <div className="success-content">
        <strong>33%</strong>
        <span className="positive-trend"><TrendingUp size={15} /> +15%</span>
      </div>
      <p>8 positive responses from 24 applications</p>
      <div className="line-chart" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

type RecentApplicationsTableProps = {
  compact?: boolean;
  rows?: JobApplication[];
  onSelect?: (application: JobApplication) => void;
  onEdit?: (application: JobApplication) => void;
  onDelete?: (application: JobApplication) => void;
};

function RecentApplicationsTable({ compact = true, rows: providedRows, onSelect, onEdit, onDelete }: RecentApplicationsTableProps) {
  const rows = providedRows ?? (compact ? applications.slice(0, 5) : applications);

  return (
    <div className="table-wrap">
      <table className={`applications-table ${compact ? 'compact-table' : ''}`}>
        <thead>
          <tr>
            <th>Company</th>
            <th>Position</th>
            {!compact ? <th>Category</th> : null}
            <th>Status</th>
            <th>Date applied</th>
            {!compact ? <th>Work mode</th> : null}
            {!compact ? <th>Last contact</th> : null}
            <th>Next step</th>
            {!compact ? <th></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((app) => (
            <tr key={app.id} onClick={() => onSelect?.(app)}>
              <td>
                <div className="company-cell">
                  <span className="company-logo">{app.company[0] || '?'}</span>
                  <div>
                    <strong>{app.company}</strong>
                    {!compact ? (
                      <small>
                        <MapPin size={12} /> {app.location}
                      </small>
                    ) : null}
                  </div>
                </div>
              </td>
              <td>
                <div className="position-cell">
                  <strong>{app.position}</strong>
                  {!compact ? <small>{app.level}</small> : null}
                </div>
              </td>
              {!compact ? (
                <td>
                  <CategoryPill category={app.category} />
                </td>
              ) : null}
              <td>
                <StatusBadge status={app.status} />
              </td>
              <td>{app.dateApplied}</td>
              {!compact ? <td>{app.workMode}</td> : null}
              {!compact ? <td>{app.lastContact}</td> : null}
              <td>{app.nextStep}</td>
              {!compact ? (
                <td className="row-actions">
                  <div className="document-actions">
                    {onEdit ? (
                      <button
                        className="ghost-icon"
                        type="button"
                        aria-label="Edit application"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(app);
                        }}
                      >
                        <Pencil size={17} />
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button
                        className="ghost-icon danger"
                        type="button"
                        aria-label="Delete application"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(app);
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    ) : null}
                    {!onEdit && !onDelete ? (
                      <button className="ghost-icon" type="button" aria-label="Open menu">
                        <MoreHorizontal size={18} />
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="page-grid dashboard-grid">
      <main className="main-column">
        <div className="metrics-grid">
          <MetricCard label="Total applied" value="24" hint="all time" />
          <MetricCard label="Active" value="5" hint="in progress" tone="blue-text" />
          <MetricCard label="Interviews" value="2" hint="upcoming" tone="rose-text" />
          <MetricCard label="Response rate" value="76%" hint="above avg" tone="green-text" />
        </div>
        <section className="panel-card recent-panel">
          <div className="card-header">
            <div>
              <h2>Recent applications</h2>
              <p>5 most recent entries</p>
            </div>
            <button className="text-button" type="button">
              View all <ChevronDown className="chevron-right" size={16} />
            </button>
          </div>
          <RecentApplicationsTable />
        </section>
        <div className="small-card-grid">
          <MiniListCard icon={Building2} title="Top companies" rows={[['Microsoft', '2'], ['Deloitte', '2'], ['EY', '1'], ['Netguru', '1'], ['Allegro', '1']]} />
          <MiniListCard icon={BriefcaseBusiness} title="Top positions" rows={[[ '.NET Developer', '5'], ['Cyber Security Analyst', '4'], ['DevOps Engineer', '3'], ['IAM Intern', '2'], ['Full Stack Developer', '2']]} />
          <MiniListCard icon={Globe} title="Sources" rows={[['Just Join IT', '8'], ['LinkedIn', '6'], ['Pracuj.pl', '5'], ['Company page', '3'], ['Other', '2']]} />
        </div>
      </main>
      <aside className="right-column">
        <ApplicationSummary />
        <SuccessRateCard />
        <UpcomingCard />
      </aside>
    </div>
  );
}

function MiniListCard({ icon: Icon, title, rows }: { icon: typeof Building2; title: string; rows: [string, string][] }) {
  return (
    <section className="panel-card mini-list-card">
      <div className="mini-title">
        <Icon size={17} />
        <h2>{title}</h2>
      </div>
      {rows.map(([label, value]) => (
        <div className="mini-row" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <button className="mini-link" type="button">View all</button>
    </section>
  );
}

function UpcomingCard() {
  return (
    <section className="panel-card upcoming-card">
      <div className="mini-title">
        <CalendarDays size={17} />
        <h2>Upcoming</h2>
      </div>
      {upcomingEvents.slice(0, 3).map((event) => (
        <div className="event-row" key={event.id}>
          <span className="event-icon"><CalendarDays size={15} /></span>
          <div>
            <strong>{event.title} — {event.company}</strong>
            <small>{event.date}, {event.time}</small>
          </div>
        </div>
      ))}
      <button className="mini-link with-arrow" type="button">View calendar <ChevronDown className="chevron-right" size={16} /></button>
    </section>
  );
}

function ApplicationsPage() {
  const {
    applications: apiApplications,
    loading,
    saving,
    error,
    loadApplications,
    createApplication,
    updateApplication,
    deleteApplication
  } = useApplications();
  const [selectedApplicationId, setSelectedApplicationId] = useState<ApplicationId | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (apiApplications.length === 0) {
      setSelectedApplicationId(null);
      return;
    }

    if (!apiApplications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(apiApplications[0].id);
    }
  }, [apiApplications, selectedApplicationId]);

  const selectedApplication = apiApplications.find((application) => application.id === selectedApplicationId) ?? apiApplications[0] ?? null;

  const openCreateModal = () => {
    setFormError(null);
    setEditingApplication(null);
    setModalMode('create');
  };

  const openEditModal = (application: JobApplication) => {
    setFormError(null);
    setEditingApplication(application);
    setModalMode('edit');
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
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : 'Could not delete application.');
    }
  };

  return (
    <section className="page-section">
      <PageTitle title="Applications" subtitle="Manage your job applications and recruitment stages." />
      <div className="toolbar">
        <div className="search-field wide">
          <Search size={18} />
          <input placeholder="Search company, position..." />
        </div>
        {['Status', 'Category', 'Location', 'Work mode', 'Source', 'Date applied'].map((filter) => (
          <button className="chip-button" type="button" key={filter}>{filter} <ChevronDown size={15} /></button>
        ))}
        <button className="secondary-button" type="button"><Download size={17} /> Export</button>
        <button className="primary-button" type="button" onClick={openCreateModal}><Plus size={17} /> Add application</button>
      </div>
      <section className="panel-card applications-panel">
        {loading ? (
          <ApplicationsStateMessage title="Loading applications" text="Fetching applications from the API." />
        ) : error && apiApplications.length === 0 ? (
          <ApplicationsStateMessage title="Could not load applications" text={error} actionLabel="Try again" onAction={loadApplications} />
        ) : apiApplications.length === 0 ? (
          <ApplicationsStateMessage title="No applications yet" text="Add your first application to start tracking the process." actionLabel="Add application" onAction={openCreateModal} />
        ) : (
          <RecentApplicationsTable
            compact={false}
            rows={apiApplications}
            onSelect={(application) => setSelectedApplicationId(application.id)}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </section>
      <section className="panel-card details-panel">
        {selectedApplication ? (
          <ApplicationDetails application={selectedApplication} onEdit={openEditModal} />
        ) : (
          <ApplicationsStateMessage title="No application selected" text="Select or add an application to see the details." />
        )}
      </section>
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

function ApplicationsStateMessage({
  title,
  text,
  actionLabel,
  onAction
}: {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="modal-content">
      <div className="mini-title">
        <BriefcaseBusiness size={18} />
        <h2>{title}</h2>
      </div>
      <p>{text}</p>
      {actionLabel && onAction ? (
        <button className="secondary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ApplicationDetails({ application, onEdit }: { application: JobApplication; onEdit?: (application: JobApplication) => void }) {
  const openOffer = () => {
    if (application.offerUrl) {
      window.open(application.offerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="details-grid">
      <div>
        <div className="details-heading">
          <span className="company-logo large">{application.company[0] || '?'}</span>
          <div>
            <h2>{application.company}</h2>
            <p>{application.position}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
        <div className="details-actions">
          <button className="secondary-button" type="button" onClick={openOffer}><ExternalLink size={17} /> Open offer</button>
          <button className="secondary-button" type="button" onClick={() => onEdit?.(application)}><Pencil size={17} /> Edit</button>
        </div>
      </div>
      <div className="details-lists">
        <InfoList title="Requirements" items={application.requirements} />
        <InfoList title="Benefits" items={application.benefits} />
        <InfoList title="Details" items={[application.location, application.workMode, application.source, application.cv]} />
      </div>
      <div className="timeline-card">
        <h3>Recruitment timeline</h3>
        {['Saved offer', 'CV sent', 'Confirmation received', 'Interview scheduled'].map((item, index) => (
          <div className="timeline-row" key={item}>
            <span />
            <div>
              <strong>{item}</strong>
              <small>{index === 0 ? '18 May 2026' : index === 1 ? '20 May 2026' : index === 2 ? '21 May 2026' : '22 May 2026'}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function ApplicationFormModal({
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
            <ApplicationFormInput label="Notes" value={form.notes} onChange={(value) => updateField('notes', value)} />
            <ApplicationFormInput label="Requirements" value={form.requirements} onChange={(value) => updateField('requirements', value)} />
            <ApplicationFormInput label="Benefits" value={form.benefits} onChange={(value) => updateField('benefits', value)} />
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

function ApplicationFormInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectionTokenGroup<T extends string>({
  title,
  tokens,
  selected,
  onSelect
}: {
  title: string;
  tokens: T[];
  selected: T;
  onSelect: (token: T) => void;
}) {
  return (
    <div className="setting-group">
      <span className="setting-label">{title}</span>
      <div className="token-row">
        {tokens.map((token) => (
          <button className={selected === token ? 'selected' : ''} type="button" key={token} onClick={() => onSelect(token)}>
            {token}
          </button>
        ))}
      </div>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  const visibleItems = items.filter(Boolean);

  return (
    <div className="info-list">
      <h3>{title}</h3>
      <div>
        {visibleItems.length > 0 ? visibleItems.map((item, index) => <span key={`${item}-${index}`}>{item}</span>) : <span>-</span>}
      </div>
    </div>
  );
}

function CompaniesPage() {
  return (
    <section className="page-section">
      <PageTitle title="Companies" subtitle="Track companies, previous applications and recruitment history." />
      <div className="toolbar">
        <div className="search-field wide"><Search size={18} /><input placeholder="Search companies..." /></div>
        <button className="chip-button" type="button">Industry <ChevronDown size={15} /></button>
        <button className="chip-button" type="button">Location <ChevronDown size={15} /></button>
        <button className="chip-button" type="button">Response history <ChevronDown size={15} /></button>
        <button className="primary-button" type="button"><Plus size={17} /> Add company</button>
      </div>
      <div className="company-grid">
        {companies.map((company) => (
          <article className="company-card panel-card" key={company.id}>
            <div className="company-card-top">
              <span className="company-logo large">{company.name[0]}</span>
              <div>
                <h2>{company.name}</h2>
                <p>{company.industry}</p>
              </div>
              <button className="ghost-icon" type="button"><MoreHorizontal size={18} /></button>
            </div>
            <div className="company-meta">
              <span><MapPin size={15} /> {company.location}</span>
              <span><Globe size={15} /> {company.website}</span>
            </div>
            <div className="company-stats">
              <div><strong>{company.applications}</strong><span>applications</span></div>
              <div><strong>{company.responseRate}%</strong><span>response</span></div>
            </div>
            <div className="company-footer">
              <StatusBadge status={company.lastStatus} />
              <span>{company.lastApplication}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatisticsPage() {
  const categories = [
    ['.NET', 38],
    ['Cybersecurity', 24],
    ['IAM', 18],
    ['DevOps', 14],
    ['React', 11],
    ['Full-stack', 9]
  ] as const;

  return (
    <section className="page-section">
      <PageTitle title="Statistics" subtitle="Analyze your application progress and discover what works best." />
      <div className="toolbar compact-toolbar">
        {['Last 7 days', 'Last 30 days', 'This month', 'All time'].map((range, index) => (
          <button className={`chip-button ${index === 3 ? 'selected' : ''}`} type="button" key={range}>{range}</button>
        ))}
        <button className="chip-button" type="button">Category <ChevronDown size={15} /></button>
        <button className="chip-button" type="button">Level <ChevronDown size={15} /></button>
        <button className="chip-button" type="button">Source <ChevronDown size={15} /></button>
      </div>
      <div className="stats-metrics-grid">
        <MetricCard label="Total applications" value="24" hint="all time" />
        <MetricCard label="Active processes" value="5" hint="currently open" />
        <MetricCard label="Response rate" value="76%" hint="above average" tone="green-text" />
        <MetricCard label="Interview rate" value="33%" hint="8 positive responses" tone="blue-text" />
        <MetricCard label="Ghosted rate" value="12%" hint="3 applications" />
        <MetricCard label="Avg response time" value="6d" hint="first contact" />
      </div>
      <div className="stats-grid">
        <section className="panel-card chart-panel wide-chart">
          <div className="mini-title"><BarChart3 size={18} /><h2>Applications by category</h2></div>
          <div className="bar-chart-list">
            {categories.map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div><span style={{ width: `${value * 2}%` }} /></div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <ApplicationSummary />
        <section className="panel-card chart-panel">
          <div className="mini-title"><TrendingUp size={18} /><h2>Applications over time</h2></div>
          <div className="soft-line-chart"><span /><span /><span /><span /><span /><span /></div>
        </section>
        <MiniListCard icon={Target} title="Most common requirements" rows={[['C#', '18'], ['SQL', '15'], ['Git', '14'], ['Azure', '9'], ['Active Directory', '7']]} />
      </div>
    </section>
  );
}

function CalendarPage() {
  const days = Array.from({ length: 35 }, (_, index) => index + 1);
  return (
    <section className="page-section">
      <PageTitle title="Calendar" subtitle="Plan interviews, follow-ups and recruitment tasks." />
      <div className="toolbar compact-toolbar">
        {['Month', 'Week', 'List'].map((item, index) => <button className={`chip-button ${index === 0 ? 'selected' : ''}`} key={item}>{item}</button>)}
        <button className="primary-button" type="button"><Plus size={17} /> Add event</button>
      </div>
      <div className="calendar-layout">
        <section className="panel-card calendar-card">
          <div className="calendar-header-row">
            <h2>May 2026</h2>
            <div><button className="ghost-icon">‹</button><button className="ghost-icon">›</button></div>
          </div>
          <div className="calendar-grid-head">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid-days">
            {days.map((day) => (
              <div className={`calendar-day ${[10, 20, 22, 28, 29, 31].includes(day) ? 'has-event' : ''}`} key={day}>
                <span>{day}</span>
                {day === 28 ? <small>Technical</small> : null}
                {day === 29 ? <small>HR interview</small> : null}
                {day === 31 ? <small>Follow-up</small> : null}
              </div>
            ))}
          </div>
        </section>
        <section className="panel-card event-panel">
          <div className="mini-title"><CalendarDays size={18} /><h2>Upcoming events</h2></div>
          {upcomingEvents.map((event) => (
            <div className="event-card" key={event.id}>
              <span className="event-icon"><Clock size={16} /></span>
              <div>
                <strong>{event.title}</strong>
                <p>{event.company}</p>
                <small>{event.date}, {event.time}</small>
              </div>
              {event.type.includes('interview') ? <Video size={16} /> : <Mail size={16} />}
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

function DocumentsPage() {
  return (
    <section className="page-section">
      <PageTitle title="Documents" subtitle="Manage CV versions, cover letters and application files." />
      <div className="toolbar">
        <div className="search-field wide"><Search size={18} /><input placeholder="Search documents..." /></div>
        <button className="secondary-button" type="button"><Upload size={17} /> Upload document</button>
        <button className="secondary-button" type="button"><Link size={17} /> Add link</button>
        <button className="chip-button" type="button">Type <ChevronDown size={15} /></button>
      </div>
      <div className="document-grid">
        {documents.map((doc) => (
          <article className="panel-card document-card" key={doc.id}>
            <div className="document-icon"><FileText size={24} /></div>
            <div>
              <h2>{doc.name}</h2>
              <p>{doc.type} · {doc.category}</p>
            </div>
            <div className="document-meta">
              <span>Updated {doc.updated}</span>
              <span>Used in {doc.usedIn} applications</span>
              <span>{doc.size}</span>
            </div>
            <div className="document-actions">
              <button className="ghost-icon" type="button"><Eye size={17} /></button>
              <button className="ghost-icon" type="button"><Download size={17} /></button>
              <button className="ghost-icon" type="button"><Pencil size={17} /></button>
              <button className="ghost-icon danger" type="button"><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </div>
      <section className="panel-card insight-strip">
        <Sparkles size={18} />
        <span>Most used CV: <strong>CV_NET_Intern_2026.pdf</strong></span>
        <span>Best response rate: <strong>CV_Cybersecurity_IAM_2026.pdf</strong></span>
      </section>
    </section>
  );
}

function NotesPage() {
  const [selectedNote, setSelectedNote] = useState(notes[0]);
  return (
    <section className="page-section">
      <PageTitle title="Notes" subtitle="Keep recruitment notes, interview questions and company research in one place." />
      <div className="toolbar">
        <div className="search-field wide"><Search size={18} /><input placeholder="Search notes..." /></div>
        <button className="chip-button" type="button">Company <ChevronDown size={15} /></button>
        <button className="chip-button" type="button">Tag <ChevronDown size={15} /></button>
        <button className="primary-button" type="button"><Plus size={17} /> Add note</button>
      </div>
      <div className="notes-layout">
        <aside className="panel-card notes-list">
          {notes.map((note) => (
            <button key={note.id} className={`note-preview ${selectedNote.id === note.id ? 'active' : ''}`} type="button" onClick={() => setSelectedNote(note)}>
              <span><StickyNote size={17} /></span>
              <div>
                <strong>{note.title}</strong>
                <small>{note.preview}</small>
              </div>
            </button>
          ))}
        </aside>
        <section className="panel-card note-editor">
          <div className="note-editor-header">
            <div>
              <h2>{selectedNote.title}</h2>
              <p>{selectedNote.company} · {selectedNote.application}</p>
            </div>
            <div className="note-tags"><Tag size={15} /> {selectedNote.tag}</div>
          </div>
          <textarea value={selectedNote.body} onChange={(event) => setSelectedNote({ ...selectedNote, body: event.target.value })} />
          <div className="note-checklist">
            <h3><CheckSquare size={17} /> Checklist</h3>
            {['Prepare examples', 'Review company page', 'Write follow-up'].map((item) => (
              <label key={item}><input type="checkbox" /> {item}</label>
            ))}
          </div>
          <div className="note-footer">
            <span>Last updated: {selectedNote.updated}</span>
            <button className="primary-button" type="button">Save note</button>
          </div>
        </section>
      </div>
    </section>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-title">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function ProfileCustomizationModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'preferences' | 'data'>('profile');
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'data', label: 'Data', icon: Database }
  ] as const;

  return (
    <div className="modal-backdrop">
      <section className="settings-modal" role="dialog" aria-modal="true" aria-label="Profile and customization">
        <header className="modal-header">
          <div>
            <h2>Profile & customization</h2>
            <p>Manage your profile, preferences and app settings.</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </header>
        <div className="modal-body">
          <aside className="modal-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? 'active' : ''}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={17} /> {tab.label}
                </button>
              );
            })}
          </aside>
          <main className="modal-content custom-scroll">
            {activeTab === 'profile' ? <ProfileTab /> : null}
            {activeTab === 'appearance' ? <AppearanceTab /> : null}
            {activeTab === 'notifications' ? <NotificationsTab /> : null}
            {activeTab === 'preferences' ? <PreferencesTab /> : null}
            {activeTab === 'data' ? <DataTab /> : null}
          </main>
        </div>
        <footer className="modal-footer">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="button" onClick={onClose}><CheckCircle2 size={17} /> Save changes</button>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input defaultValue={value} />
    </label>
  );
}

function ProfileTab() {
  return (
    <div className="tab-content">
      <div className="profile-photo-row">
        <span className="profile-photo"><User size={31} /></span>
        <div>
          <h3>Profile photo</h3>
          <p>Upload a photo or leave the default avatar.</p>
          <button className="text-button strong" type="button">Change avatar</button>
        </div>
      </div>
      <div className="form-grid">
        <Field label="Full name" value="Kasia Wiśniewska" />
        <Field label="Email address" value="kasia@example.com" />
        <Field label="Job search title" value="Junior .NET / Cybersecurity Intern" />
        <Field label="Preferred location" value="Warsaw, Poland" />
        <Field label="Preferred work mode" value="Hybrid" />
      </div>
    </div>
  );
}

function AppearanceTab() {
  return (
    <div className="tab-content">
      <div className="setting-group">
        <span className="setting-label">Theme</span>
        <div className="segmented-row">
          <button className="selected" type="button"><Sun size={16} /> Light</button>
          <button type="button"><Moon size={16} /> Dark</button>
          <button type="button"><Monitor size={16} /> System</button>
        </div>
      </div>
      <div className="setting-group">
        <span className="setting-label">Accent color</span>
        <div className="color-row">
          {['Taupe', 'Champagne', 'Dusty rose', 'Soft brown', 'Beige'].map((color) => <button className={`color-dot ${color.toLowerCase().replaceAll(' ', '-')}`} type="button" key={color}><span />{color}</button>)}
        </div>
      </div>
      <div className="setting-group">
        <span className="setting-label">Layout density</span>
        <div className="segmented-row"><button className="selected" type="button">Comfortable</button><button type="button">Compact</button></div>
      </div>
      <ToggleRow title="Show motivational card in sidebar" text="Display desk inspiration card at the bottom of the sidebar." checked />
      <ToggleRow title="Enable subtle animations" text="Smooth transitions for cards, modals and page changes." checked />
    </div>
  );
}

function ToggleRow({ title, text, checked }: { title: string; text: string; checked?: boolean }) {
  return (
    <div className="toggle-row">
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      <label className="switch"><input type="checkbox" defaultChecked={checked} /><span /></label>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="tab-content">
      <ToggleRow title="Interview reminders" text="Remind me 24h and 1h before each interview." checked />
      <ToggleRow title="Follow-up reminders" text="Remind me to follow up after no response." checked />
      <ToggleRow title="Application deadlines" text="Alerts for deadlines set on offers." />
      <ToggleRow title="Weekly recruitment summary" text="Every Monday — overview of the past week." checked />
      <ToggleRow title="Monthly statistics report" text="First of each month — your recruitment statistics." />
      <Field label="Default reminder time" value="15 minutes before" />
    </div>
  );
}

function PreferencesTab() {
  const categories = ['.NET', 'C#', 'Cybersecurity', 'IAM', 'SOC', 'DevOps', 'React', 'Full-stack', 'Backend', 'Frontend', 'Data / AI'];
  const levels = ['Internship', 'Trainee', 'Working Student', 'Junior', 'Junior-friendly', 'Mid', 'Senior'];
  const statuses = ['Saved', 'Applied', 'In progress', 'HR interview', 'Technical interview', 'Task / test', 'Offer', 'Rejected', 'No response', 'Ghosted', 'Withdrawn', 'Archived'];
  return (
    <div className="tab-content">
      <TokenGroup title="Preferred categories" tokens={categories} selected={['.NET', 'C#', 'Cybersecurity', 'IAM', 'DevOps']} />
      <TokenGroup title="Preferred job levels" tokens={levels} selected={['Internship', 'Junior', 'Junior-friendly']} />
      <div className="rules-grid">
        <Field label="Mark as no response after" value="14 days" />
        <Field label="Mark as ghosted after" value="30 days" />
        <Field label="Suggest follow-up after" value="7 days" />
      </div>
      <TokenGroup title="Application statuses" tokens={statuses} selected={['Applied', 'In progress', 'Interview', 'Offer', 'Rejected']} />
    </div>
  );
}

function TokenGroup({ title, tokens, selected }: { title: string; tokens: string[]; selected: string[] }) {
  return (
    <div className="setting-group">
      <span className="setting-label">{title}</span>
      <div className="token-row">
        {tokens.map((token) => <button className={selected.includes(token) ? 'selected' : ''} type="button" key={token}>{token}</button>)}
      </div>
    </div>
  );
}

function DataTab() {
  const actions = [
    { icon: Upload, title: 'Import CSV', text: 'Import applications from a CSV file.', tone: 'blue' },
    { icon: Download, title: 'Export CSV', text: 'Download all applications as a CSV file.', tone: 'green' },
    { icon: FileText, title: 'Export PDF report', text: 'Generate a full recruitment PDF report.', tone: 'beige' },
    { icon: Database, title: 'Backup data', text: 'Save a complete backup of your data.', tone: 'green' },
    { icon: Trash2, title: 'Delete all data', text: 'Permanently delete all applications and data. Cannot be undone.', tone: 'danger' }
  ] as const;
  return (
    <div className="tab-content data-actions">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button className="data-action" type="button" key={action.title}>
            <span className={`data-icon ${action.tone}`}><Icon size={20} /></span>
            <div>
              <strong>{action.title}</strong>
              <p>{action.text}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pageHeader = useMemo(() => {
    if (page === 'dashboard') return { title: 'Good morning, Kasia', subtitle: 'Here’s an overview of your recruitment progress.' };
    const labels: Record<Page, { title: string; subtitle: string }> = {
      dashboard: { title: 'Good morning, Kasia', subtitle: 'Here’s an overview of your recruitment progress.' },
      applications: { title: 'Applications', subtitle: 'Manage your job applications and recruitment stages.' },
      companies: { title: 'Companies', subtitle: 'Track companies, previous applications and recruitment history.' },
      statistics: { title: 'Statistics', subtitle: 'Analyze your application progress and discover what works best.' },
      calendar: { title: 'Calendar', subtitle: 'Plan interviews, follow-ups and recruitment tasks.' },
      documents: { title: 'Documents', subtitle: 'Manage CV versions, cover letters and application files.' },
      notes: { title: 'Notes', subtitle: 'Keep recruitment notes, interview questions and company research in one place.' }
    };
    return labels[page];
  }, [page]);

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar currentPage={page} onPageChange={setPage} />
      <div className="workspace">
        <Topbar title={pageHeader.title} subtitle={pageHeader.subtitle} theme={theme} setTheme={setTheme} onOpenSettings={() => setSettingsOpen(true)} />
        <div className="content custom-scroll">
          {page === 'dashboard' ? <DashboardPage /> : null}
          {page === 'applications' ? <ApplicationsPage /> : null}
          {page === 'companies' ? <CompaniesPage /> : null}
          {page === 'statistics' ? <StatisticsPage /> : null}
          {page === 'calendar' ? <CalendarPage /> : null}
          {page === 'documents' ? <DocumentsPage /> : null}
          {page === 'notes' ? <NotesPage /> : null}
        </div>
      </div>
      {settingsOpen ? <ProfileCustomizationModal onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  );
}

export default App;

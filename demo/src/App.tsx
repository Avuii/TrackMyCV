import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  Link as LinkIcon,
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
  Settings2,
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
  X
} from 'lucide-react';

type Page = 'dashboard' | 'applications' | 'companies' | 'statistics' | 'calendar' | 'documents' | 'notes';
type Theme = 'light' | 'dark';
type Status = 'Saved' | 'Applied' | 'In progress' | 'Interview' | 'Task / test' | 'Offer' | 'Rejected' | 'No response' | 'Ghosted' | 'Archived';
type WorkMode = 'Remote' | 'Hybrid' | 'On-site';

type JobApplication = {
  id: number;
  company: string;
  domain: string;
  position: string;
  category: string;
  level: string;
  status: Status;
  dateApplied: string;
  lastContact: string;
  nextStep: string;
  location: string;
  workMode: WorkMode;
  source: string;
  offerUrl: string;
  requirements: string;
  benefits: string;
  notes: string;
  cv: string;
};

type Company = {
  id: number;
  name: string;
  domain: string;
  industry: string;
  location: string;
  website: string;
  notes: string;
};

type DocumentItem = {
  id: number;
  name: string;
  type: string;
  category: string;
  updated: string;
  usedIn: number;
  size: string;
};

type NoteItem = {
  id: number;
  title: string;
  company: string;
  application: string;
  tag: string;
  updated: string;
  preview: string;
  body: string;
};

type EventItem = {
  id: number;
  title: string;
  company: string;
  date: string;
  time: string;
  type: string;
};

type Profile = {
  name: string;
  email: string;
  title: string;
  location: string;
  workMode: WorkMode;
};

const STORAGE_KEYS = {
  session: 'trackmycv.session',
  profile: 'trackmycv.profile',
  applications: 'trackmycv.applications',
  theme: 'trackmycv.theme',
  notes: 'trackmycv.notes'
};

const initialProfile: Profile = {
  name: 'Kasia Wiśniewska',
  email: 'kasia@example.com',
  title: 'Junior .NET / Cybersecurity Intern',
  location: 'Warsaw, Poland',
  workMode: 'Hybrid'
};

const companyDomains: Record<string, string> = {
  Microsoft: 'microsoft.com',
  Deloitte: 'deloitte.com',
  EY: 'ey.com',
  Allegro: 'allegro.eu',
  Netguru: 'netguru.com',
  Comarch: 'comarch.pl',
  Accenture: 'accenture.com',
  Sii: 'sii.pl',
  'Commerzbank': 'commerzbank.com'
};

const initialApplications: JobApplication[] = [
  {
    id: 1,
    company: 'Microsoft',
    domain: 'microsoft.com',
    position: '.NET Developer Intern',
    category: '.NET',
    level: 'Intern',
    status: 'Interview',
    dateApplied: '2026-05-20',
    lastContact: '2026-05-22',
    nextStep: 'Technical interview',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'LinkedIn',
    offerUrl: 'https://careers.microsoft.com',
    requirements: 'C#, .NET, SQL, REST API, Git',
    benefits: 'Hybrid work, mentoring, training budget',
    notes: 'Revise async/await, DI and EF Core before interview.',
    cv: 'CV_NET_Intern_2026.pdf'
  },
  {
    id: 2,
    company: 'Deloitte',
    domain: 'deloitte.com',
    position: 'Cyber Security Analyst',
    category: 'Cybersecurity',
    level: 'Junior',
    status: 'In progress',
    dateApplied: '2026-05-18',
    lastContact: '2026-05-20',
    nextStep: 'HR interview',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'Company career page',
    offerUrl: 'https://www.deloitte.com/careers',
    requirements: 'IAM, security basics, English, documentation',
    benefits: 'Learning path, consulting projects, private healthcare',
    notes: 'Prepare IAM, Entra ID and business motivation.',
    cv: 'CV_Cybersecurity_IAM_2026.pdf'
  },
  {
    id: 3,
    company: 'EY',
    domain: 'ey.com',
    position: 'IAM Intern',
    category: 'IAM',
    level: 'Intern',
    status: 'Applied',
    dateApplied: '2026-05-15',
    lastContact: '',
    nextStep: 'Waiting',
    location: 'Warsaw',
    workMode: 'On-site',
    source: 'LinkedIn',
    offerUrl: 'https://ey.com/careers',
    requirements: 'Active Directory, Entra ID, MFA, access management',
    benefits: 'Office events, training, mentor support',
    notes: 'Good match for IAM and cybersecurity direction.',
    cv: 'CV_Cybersecurity_IAM_2026.pdf'
  },
  {
    id: 4,
    company: 'Allegro',
    domain: 'allegro.eu',
    position: 'Junior DevOps',
    category: 'DevOps',
    level: 'Junior-friendly',
    status: 'No response',
    dateApplied: '2026-05-10',
    lastContact: '',
    nextStep: 'Follow-up',
    location: 'Remote',
    workMode: 'Remote',
    source: 'Just Join IT',
    offerUrl: 'https://jobs.allegro.eu',
    requirements: 'Docker, CI/CD, Linux, Git',
    benefits: 'Remote work, tech community, flexible hours',
    notes: 'Consider sending follow-up after 14 days.',
    cv: 'CV_General_IT_2026.pdf'
  },
  {
    id: 5,
    company: 'Netguru',
    domain: 'netguru.com',
    position: '.NET Developer',
    category: '.NET',
    level: 'Junior',
    status: 'Rejected',
    dateApplied: '2026-05-05',
    lastContact: '2026-05-12',
    nextStep: 'Closed',
    location: 'Remote',
    workMode: 'Remote',
    source: 'Pracuj.pl',
    offerUrl: 'https://www.netguru.com/career',
    requirements: 'C#, .NET, EF Core, testing',
    benefits: 'Remote-first, English projects, workshops',
    notes: 'Feedback: improve C# fundamentals and EF Core.',
    cv: 'CV_NET_Intern_2026.pdf'
  },
  {
    id: 6,
    company: 'Comarch',
    domain: 'comarch.pl',
    position: 'Junior Full-stack Developer',
    category: 'Full-stack',
    level: 'Junior',
    status: 'Ghosted',
    dateApplied: '2026-05-02',
    lastContact: '',
    nextStep: 'Archive or follow-up',
    location: 'Łódź',
    workMode: 'Hybrid',
    source: 'Pracuj.pl',
    offerUrl: 'https://kariera.comarch.pl',
    requirements: 'C#, React, SQL, Git',
    benefits: 'Hybrid work, training, team projects',
    notes: 'No response after 30 days.',
    cv: 'CV_Fullstack_React_NET.pdf'
  },
  {
    id: 7,
    company: 'Accenture',
    domain: 'accenture.com',
    position: 'Security Internship',
    category: 'Cybersecurity',
    level: 'Internship',
    status: 'Offer',
    dateApplied: '2026-04-28',
    lastContact: '2026-05-07',
    nextStep: 'Decision',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'Company career page',
    offerUrl: 'https://www.accenture.com/careers',
    requirements: 'Security basics, cloud, English',
    benefits: 'Global projects, mentoring, certifications',
    notes: 'Strong match with cybersecurity path.',
    cv: 'CV_Cybersecurity_IAM_2026.pdf'
  }
];

const initialCompanies: Company[] = [
  { id: 1, name: 'Microsoft', domain: 'microsoft.com', industry: 'Technology', location: 'Warsaw', website: 'microsoft.com', notes: 'Strong .NET match.' },
  { id: 2, name: 'Deloitte', domain: 'deloitte.com', industry: 'Consulting', location: 'Warsaw', website: 'deloitte.com', notes: 'Cybersecurity and IAM roles.' },
  { id: 3, name: 'EY', domain: 'ey.com', industry: 'Consulting', location: 'Warsaw', website: 'ey.com', notes: 'IAM-focused internships.' },
  { id: 4, name: 'Allegro', domain: 'allegro.eu', industry: 'E-commerce', location: 'Remote', website: 'allegro.eu', notes: 'Follow-up recommended.' },
  { id: 5, name: 'Netguru', domain: 'netguru.com', industry: 'Software house', location: 'Remote', website: 'netguru.com', notes: 'Useful feedback received.' },
  { id: 6, name: 'Comarch', domain: 'comarch.pl', industry: 'Software', location: 'Łódź', website: 'comarch.pl', notes: 'No response.' },
  { id: 7, name: 'Accenture', domain: 'accenture.com', industry: 'Consulting', location: 'Warsaw', website: 'accenture.com', notes: 'Security roles.' }
];

const documents: DocumentItem[] = [
  { id: 1, name: 'CV_NET_Intern_2026.pdf', type: 'CV', category: '.NET', updated: '2026-05-18', usedIn: 5, size: '420 KB' },
  { id: 2, name: 'CV_Cybersecurity_IAM_2026.pdf', type: 'CV', category: 'Cybersecurity', updated: '2026-05-19', usedIn: 4, size: '436 KB' },
  { id: 3, name: 'CV_Fullstack_React_NET.pdf', type: 'CV', category: 'Full-stack', updated: '2026-05-12', usedIn: 2, size: '448 KB' },
  { id: 4, name: 'Cover_Letter_Deloitte.pdf', type: 'Cover letter', category: 'Cybersecurity', updated: '2026-05-18', usedIn: 1, size: '198 KB' },
  { id: 5, name: 'Portfolio_Link', type: 'Portfolio', category: 'General', updated: '2026-05-20', usedIn: 7, size: 'URL' },
  { id: 6, name: 'GitHub_Profile', type: 'GitHub', category: 'General', updated: '2026-05-20', usedIn: 7, size: 'URL' }
];

const initialNotes: NoteItem[] = [
  {
    id: 1,
    title: 'Deloitte — HR interview preparation',
    company: 'Deloitte',
    application: 'Cyber Security Analyst',
    tag: 'Interview preparation',
    updated: '2026-05-21',
    preview: 'Prepare motivation, consulting angle and IAM basics.',
    body: 'Talk about developer background, interest in security, IAM and real business systems. Prepare answers about teamwork, English and learning mindset.'
  },
  {
    id: 2,
    title: 'EY — IAM topics to revise',
    company: 'EY',
    application: 'IAM Intern',
    tag: 'Technical questions',
    updated: '2026-05-20',
    preview: 'Active Directory, Entra ID, MFA, Conditional Access.',
    body: 'Revise identity lifecycle, authentication vs authorization, MFA, conditional access and basic AD structure.'
  },
  {
    id: 3,
    title: 'Microsoft — .NET technical questions',
    company: 'Microsoft',
    application: '.NET Developer Intern',
    tag: 'Technical questions',
    updated: '2026-05-22',
    preview: 'C#, DI, async/await, EF Core and REST API basics.',
    body: 'Review interfaces, dependency injection, async/await, IQueryable vs IEnumerable, try/catch/finally, EF Core migrations and REST endpoints.'
  }
];

const upcomingEvents: EventItem[] = [
  { id: 1, title: 'Technical interview', company: 'Microsoft', date: '2026-05-28', time: '10:00', type: 'Technical interview' },
  { id: 2, title: 'HR interview', company: 'Deloitte', date: '2026-05-29', time: '14:00', type: 'HR interview' },
  { id: 3, title: 'Follow-up', company: 'Allegro', date: '2026-05-31', time: '09:00', type: 'Follow-up reminder' },
  { id: 4, title: 'Online test', company: 'EY', date: '2026-06-02', time: '16:00', type: 'Online test' }
];

type InspirationCard = {
  title: string;
  text: string;
  image: string;
};

const inspirationCards: InspirationCard[] = [
  { title: 'Stay consistent', text: 'Small steps every day lead to big changes.', image: '/assets/bed-coffe.jpg' },
  { title: 'Slow progress counts', text: 'One thoughtful application is still progress.', image: '/assets/cofee-photo2.webp' },
  { title: 'Keep it soft', text: 'You do not need chaos to move forward.', image: '/assets/candle-vanilla.jpg' },
  { title: 'Tiny wins matter', text: 'A saved offer, a sent CV, a follow-up — all count.', image: '/assets/croissant-bow.jpg' },
  { title: 'Protect your energy', text: 'Not every rejection says something about you.', image: '/assets/cat-bed.jpg' },
  { title: 'One clean step', text: 'Today can be only one application. That is enough.', image: '/assets/cozy-home.jpg' },
  { title: 'Stay curious', text: 'Every offer teaches you what to learn next.', image: '/assets/desk-photo2.jpg' },
  { title: 'Reset gently', text: 'A quiet break can make the next step clearer.', image: '/assets/coffee-metal.jpg' },
  { title: 'No rush, still moving', text: 'Consistency is calmer than pressure.', image: '/assets/pancake.jpg' },
  { title: 'Focus on fit', text: 'The right process should feel possible, not impossible.', image: '/assets/work2.webp' }
];

function pickInspiration() {
  return inspirationCards[Math.floor(Math.random() * inspirationCards.length)];
}


const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', icon: BriefcaseBusiness },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote }
];

const statuses: Status[] = ['Saved', 'Applied', 'In progress', 'Interview', 'Task / test', 'Offer', 'Rejected', 'No response', 'Ghosted', 'Archived'];
const categories = ['.NET', 'C#', 'Cybersecurity', 'IAM', 'SOC', 'DevOps', 'React', 'Full-stack', 'Backend', 'Frontend', 'Data / AI', 'Support IT', 'Other'];
const levels = ['Internship', 'Intern', 'Trainee', 'Working Student', 'Junior', 'Junior-friendly', 'Mid', 'Senior'];
const workModes: WorkMode[] = ['Remote', 'Hybrid', 'On-site'];
const sources = ['LinkedIn', 'Just Join IT', 'Pracuj.pl', 'Company career page', 'No Fluff Jobs', 'Other'];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function safeDomain(company: string, domain?: string) {
  return domain || companyDomains[company] || `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
}

function getStatusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '').replace(/[^a-z-]/g, '');
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function CompanyLogo({ name, domain, large = false }: { name: string; domain?: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const resolvedDomain = safeDomain(name, domain);
  return (
    <span className={`company-logo ${large ? 'large' : ''}`}>
      {!failed ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=64`}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </span>
  );
}

function Logo() {
  return (
    <div className="brand">
      <div className="brand-icon" aria-hidden="true">
        <Folder size={24} strokeWidth={1.8} />
        <Search className="brand-search" size={15} strokeWidth={2} />
      </div>
      <div>
        <div className="brand-name">TrackMyCV</div>
        <div className="brand-subtitle">Job tracker</div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (profile: Profile) => void }) {
  const [email, setEmail] = useState('kasia@example.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes('@') || password.length < 4) {
      setError('Podaj poprawny e-mail i hasło minimum 4 znaki.');
      return;
    }
    const profile = { ...initialProfile, email };
    writeStorage(STORAGE_KEYS.session, true);
    writeStorage(STORAGE_KEYS.profile, profile);
    onLogin(profile);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Logo />
        <div className="login-copy">
          <span className="eyebrow">Live demo</span>
          <h1>Track applications without chaos.</h1>
          <p>Log in to open a frontend-only mockup with local data, working modals and saved changes in your browser.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button full" type="submit">Log in</button>
          <small>Demo accepts any e-mail and password with at least 4 characters.</small>
        </form>
      </section>
      <aside className="login-visual">
        <img src="/assets/desk-photo.jpg" alt="Soft desk with laptop and CV" />
        <div className="visual-card">
          <CheckCircle2 size={18} />
          <span>Soft productivity dashboard</span>
        </div>
      </aside>
    </main>
  );
}

function Sidebar({ page, setPage, applications }: { page: Page; setPage: (page: Page) => void; applications: JobApplication[] }) {
  const activeCount = applications.filter((app) => !['Rejected', 'Ghosted', 'Archived'].includes(app.status)).length;
  const upcomingCount = applications.filter((app) => app.status === 'Interview').length;
  const [inspiration, setInspiration] = useState<InspirationCard>(() => pickInspiration());

  useEffect(() => {
    const interval = window.setInterval(() => setInspiration(pickInspiration()), 45000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar">
      <Logo />
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const badge = item.id === 'applications' ? activeCount : item.id === 'calendar' ? upcomingCount : undefined;
          return (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} type="button" onClick={() => setPage(item.id)}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
              {badge ? <span className="nav-badge">{badge}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-card inspiration-card">
        <img src={inspiration.image} alt="Soft cozy inspiration" />
        <h3>{inspiration.title}</h3>
        <p>{inspiration.text}</p>
        <button className="inspiration-action" type="button" onClick={() => setInspiration(pickInspiration())} aria-label="Show another thought">
          <Heart size={18} strokeWidth={1.7} />
          <span>New thought</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  page,
  profile,
  theme,
  setTheme,
  onOpenApplication,
  onOpenSettings,
  onLogout,
  setPage
}: {
  page: Page;
  profile: Profile;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenApplication: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onLogout: () => void;
  setPage: (page: Page) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDashboard = page === 'dashboard';
  const label = `Good morning, ${profile.name.split(' ')[0] || 'Kasia'}`;
  const subtitle = 'Here’s an overview of your recruitment progress.';

  function openSettings(tab: SettingsTab) {
    setOpen(false);
    onOpenSettings(tab);
  }

  return (
    <header className={`topbar ${!isDashboard ? 'actions-only' : ''}`}>
      {isDashboard ? (
        <div className="topbar-title">
          <h1>{label}</h1>
          <p>{subtitle}</p>
        </div>
      ) : <div className="topbar-spacer" />}
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Search" onClick={() => setPage('applications')}>
          <Search size={19} />
        </button>
        <button className="icon-button with-dot" type="button" aria-label="Notifications" onClick={() => openSettings('notifications')}>
          <Bell size={19} />
        </button>
        <button className="icon-button" type="button" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <div className="profile-wrap">
          <button className={`profile-button ${open ? 'open' : ''}`} type="button" onClick={() => setOpen((value) => !value)}>
            <span className="avatar-soft"><User size={18} /></span>
            <span>{profile.name.split(' ')[0] || 'Kasia'}</span>
            <ChevronDown size={16} className={open ? 'rotated' : ''} />
          </button>
          {open ? (
            <div className="profile-menu">
              <div className="profile-menu-header">
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
              </div>
              <button type="button" onClick={() => openSettings('profile')}><User size={17} /> Profile</button>
              <button type="button" onClick={() => openSettings('appearance')}><Palette size={17} /> Appearance</button>
              <button type="button" onClick={() => openSettings('notifications')}><Bell size={17} /> Notifications</button>
              <button type="button" onClick={() => openSettings('preferences')}><SlidersHorizontal size={17} /> Preferences</button>
              <button type="button" onClick={() => openSettings('data')}><Download size={17} /> Data & export</button>
              <button type="button" className="danger-link" onClick={onLogout}><LogOut size={17} /> Log out</button>
            </div>
          ) : null}
        </div>
        <button className="primary-button" type="button" onClick={onOpenApplication}><Plus size={18} /> Add application</button>
        <button className="secondary-button" type="button" onClick={() => setPage('applications')}><Filter size={18} /> Filter</button>
      </div>
    </header>
  );
}

const pageLabels: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Here’s an overview of your recruitment progress.' },
  applications: { title: 'Applications', subtitle: 'Manage your job applications and recruitment stages.' },
  companies: { title: 'Companies', subtitle: 'Track companies, previous applications and recruitment history.' },
  statistics: { title: 'Statistics', subtitle: 'Analyze your application progress and discover what works best.' },
  calendar: { title: 'Calendar', subtitle: 'Plan interviews, follow-ups and recruitment tasks.' },
  documents: { title: 'Documents', subtitle: 'Manage CV versions, cover letters and application files.' },
  notes: { title: 'Notes', subtitle: 'Keep recruitment notes, interview questions and company research in one place.' }
};

function PageHeader({ page }: { page: Page }) {
  const meta = pageLabels[page];
  return (
    <header className="page-header">
      <div>
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
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

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-${getStatusClass(status)}`}>{status}</span>;
}

function CategoryPill({ category }: { category: string }) {
  return <span className="category-pill">{category}</span>;
}

function calculateStats(applications: JobApplication[]) {
  const total = applications.length;
  const active = applications.filter((app) => ['Applied', 'In progress', 'Interview', 'Task / test'].includes(app.status)).length;
  const interviews = applications.filter((app) => app.status === 'Interview' || app.status === 'Offer').length;
  const positive = applications.filter((app) => ['Interview', 'Task / test', 'Offer', 'In progress'].includes(app.status)).length;
  const response = applications.filter((app) => !['Applied', 'No response', 'Ghosted', 'Saved'].includes(app.status)).length;
  const responseRate = total ? Math.round((response / total) * 100) : 0;
  const successRate = total ? Math.round((positive / total) * 100) : 0;
  return { total, active, interviews, responseRate, successRate, positive };
}

function DashboardPage({ applications, setPage }: { applications: JobApplication[]; setPage: (page: Page) => void }) {
  const stats = calculateStats(applications);
  const latest = [...applications].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied)).slice(0, 5);

  return (
    <div className="page-grid dashboard-grid">
      <main className="main-column">
        <div className="metrics-grid">
          <MetricCard label="Total applied" value={stats.total} hint="all time" />
          <MetricCard label="Active" value={stats.active} hint="in progress" tone="blue-text" />
          <MetricCard label="Interviews" value={stats.interviews} hint="positive stages" tone="rose-text" />
          <MetricCard label="Response rate" value={`${stats.responseRate}%`} hint="from all applications" tone="green-text" />
        </div>
        <section className="panel-card recent-panel">
          <div className="card-header">
            <div>
              <h2>Recent applications</h2>
              <p>5 most recent entries</p>
            </div>
            <button className="text-button" type="button" onClick={() => setPage('applications')}>View all <ChevronDown className="chevron-right" size={16} /></button>
          </div>
          <ApplicationsTable applications={latest} compact />
        </section>
        <div className="small-card-grid">
          <MiniListCard icon={Building2} title="Top companies" rows={topRows(applications.map((app) => app.company))} />
          <MiniListCard icon={BriefcaseBusiness} title="Top positions" rows={topRows(applications.map((app) => app.category))} />
          <MiniListCard icon={Globe} title="Sources" rows={topRows(applications.map((app) => app.source))} />
        </div>
      </main>
      <aside className="right-column">
        <ApplicationSummary applications={applications} />
        <SuccessRateCard applications={applications} />
        <UpcomingCard />
      </aside>
    </div>
  );
}

function topRows(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => [label, String(value)] as [string, string]);
}

function MiniListCard({ icon: Icon, title, rows }: { icon: typeof Building2; title: string; rows: [string, string][] }) {
  return (
    <section className="panel-card mini-list-card">
      <div className="mini-title"><Icon size={17} /><h2>{title}</h2></div>
      {rows.map(([label, value]) => <div className="mini-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      <button className="mini-link" type="button">View all</button>
    </section>
  );
}

function ApplicationSummary({ applications }: { applications: JobApplication[] }) {
  const rows = statuses
    .map((status) => [status, applications.filter((app) => app.status === status).length] as const)
    .filter(([, count]) => count > 0);
  const total = applications.length || 1;
  const segments = rows.map(([, count]) => `${(count / total) * 100}%`).join(' ');

  return (
    <section className="panel-card summary-card">
      <div className="card-header compact"><div><h2>Application summary</h2><p>{applications.length} total applications</p></div></div>
      <div className="donut-wrap">
        <div className="donut-chart" style={{ ['--segments' as string]: segments }}>
          <div><strong>{applications.length}</strong><span>applications</span></div>
        </div>
        <div className="summary-list">
          {rows.map(([label, count]) => <div className="summary-row" key={label}><span className={`summary-dot status-dot-${getStatusClass(label)}`} /><span>{label}</span><strong>{count}</strong></div>)}
        </div>
      </div>
    </section>
  );
}

function SuccessRateCard({ applications }: { applications: JobApplication[] }) {
  const stats = calculateStats(applications);
  return (
    <section className="panel-card success-card">
      <h2>Success rate</h2>
      <p>Positive recruitment stages</p>
      <div className="success-content"><strong>{stats.successRate}%</strong><span className="positive-trend"><TrendingUp size={15} /> +15%</span></div>
      <p>{stats.positive} positive responses from {stats.total} applications</p>
      <div className="line-chart" aria-hidden="true"><span /><span /><span /><span /><span /></div>
    </section>
  );
}

function UpcomingCard() {
  return (
    <section className="panel-card upcoming-card">
      <div className="mini-title"><CalendarDays size={17} /><h2>Upcoming</h2></div>
      {upcomingEvents.slice(0, 3).map((event) => (
        <div className="event-row" key={event.id}>
          <span className="event-icon"><CalendarDays size={15} /></span>
          <div><strong>{event.title} — {event.company}</strong><small>{formatDate(event.date)}, {event.time}</small></div>
        </div>
      ))}
      <button className="mini-link with-arrow" type="button">View calendar <ChevronDown className="chevron-right" size={16} /></button>
    </section>
  );
}

function ApplicationsTable({
  applications,
  compact = false,
  onSelect,
  selectedId,
  onStatusChange,
  onDelete
}: {
  applications: JobApplication[];
  compact?: boolean;
  onSelect?: (application: JobApplication) => void;
  selectedId?: number;
  onStatusChange?: (id: number, status: Status) => void;
  onDelete?: (id: number) => void;
}) {
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
            {!compact ? <th aria-label="Actions" /> : null}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className={selectedId === app.id ? 'selected-row' : ''} onClick={() => onSelect?.(app)}>
              <td>
                <div className="company-cell">
                  <CompanyLogo name={app.company} domain={app.domain} />
                  <div><strong>{app.company}</strong>{!compact ? <small><MapPin size={12} /> {app.location}</small> : null}</div>
                </div>
              </td>
              <td><div className="position-cell"><strong>{app.position}</strong>{!compact ? <small>{app.level}</small> : null}</div></td>
              {!compact ? <td><CategoryPill category={app.category} /></td> : null}
              <td>
                {onStatusChange && !compact ? (
                  <select className={`status-select status-${getStatusClass(app.status)}`} value={app.status} onChange={(event) => onStatusChange(app.id, event.target.value as Status)} onClick={(event) => event.stopPropagation()}>
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                ) : <StatusBadge status={app.status} />}
              </td>
              <td>{formatDate(app.dateApplied)}</td>
              {!compact ? <td>{app.workMode}</td> : null}
              {!compact ? <td>{formatDate(app.lastContact)}</td> : null}
              <td>{app.nextStep}</td>
              {!compact ? (
                <td className="row-actions">
                  <button className="ghost-icon" type="button" aria-label="Open offer" onClick={(event) => { event.stopPropagation(); window.open(app.offerUrl, '_blank'); }}><ExternalLink size={17} /></button>
                  <button className="ghost-icon danger" type="button" aria-label="Delete" onClick={(event) => { event.stopPropagation(); onDelete?.(app.id); }}><Trash2 size={17} /></button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicationsPage({
  applications,
  onOpenApplication,
  onStatusChange,
  onDelete,
  selectedApplication,
  setSelectedApplication,
  onExport
}: {
  applications: JobApplication[];
  onOpenApplication: () => void;
  onStatusChange: (id: number, status: Status) => void;
  onDelete: (id: number) => void;
  selectedApplication: JobApplication | null;
  setSelectedApplication: (application: JobApplication) => void;
  onExport: () => void;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState('All');

  const filtered = applications.filter((app) => {
    const search = `${app.company} ${app.position} ${app.category} ${app.source}`.toLowerCase();
    return (
      search.includes(query.toLowerCase()) &&
      (status === 'All' || app.status === status) &&
      (category === 'All' || app.category === category) &&
      (mode === 'All' || app.workMode === mode)
    );
  });

  useEffect(() => {
    if (!selectedApplication && filtered[0]) setSelectedApplication(filtered[0]);
  }, [filtered, selectedApplication, setSelectedApplication]);

  return (
    <section className="page-section">
      <div className="toolbar">
        <div className="search-field wide"><Search size={18} /><input placeholder="Search company, position..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <SelectChip value={status} onChange={setStatus} options={['All', ...statuses]} label="Status" />
        <SelectChip value={category} onChange={setCategory} options={['All', ...categories]} label="Category" />
        <SelectChip value={mode} onChange={setMode} options={['All', ...workModes]} label="Work mode" />
        <button className="secondary-button" type="button" onClick={onExport}><Download size={17} /> Export</button>
      </div>
      <section className="panel-card applications-panel">
        <ApplicationsTable applications={filtered} selectedId={selectedApplication?.id} onSelect={setSelectedApplication} onStatusChange={onStatusChange} onDelete={onDelete} />
      </section>
      {selectedApplication ? <section className="panel-card details-panel"><ApplicationDetails application={selectedApplication} /></section> : null}
    </section>
  );
}

function SelectChip({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="select-chip">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

function ApplicationDetails({ application }: { application: JobApplication }) {
  return (
    <div className="details-grid">
      <div>
        <div className="details-heading">
          <CompanyLogo name={application.company} domain={application.domain} large />
          <div><h2>{application.company}</h2><p>{application.position}</p></div>
          <StatusBadge status={application.status} />
        </div>
        <div className="details-actions">
          <button className="secondary-button" type="button" onClick={() => window.open(application.offerUrl, '_blank')}><ExternalLink size={17} /> Open offer</button>
          <button className="secondary-button" type="button"><Pencil size={17} /> Edit later</button>
        </div>
      </div>
      <div className="details-lists">
        <InfoList title="Requirements" text={application.requirements} />
        <InfoList title="Benefits" text={application.benefits} />
        <InfoList title="Details" text={`${application.location}, ${application.workMode}, ${application.source}, ${application.cv}`} />
      </div>
      <div className="timeline-card">
        <h3>Recruitment timeline</h3>
        {['Saved offer', 'CV sent', application.lastContact ? 'Company response' : 'Waiting', application.nextStep].map((item, index) => (
          <div className="timeline-row" key={`${item}-${index}`}><span /><div><strong>{item}</strong><small>{index === 0 ? formatDate(application.dateApplied) : index === 1 ? formatDate(application.dateApplied) : index === 2 ? formatDate(application.lastContact) : 'Next step'}</small></div></div>
        ))}
      </div>
    </div>
  );
}

function InfoList({ title, text }: { title: string; text: string }) {
  return <div className="info-list"><h3>{title}</h3><div>{text.split(',').map((item) => <span key={item.trim()}>{item.trim()}</span>)}</div></div>;
}

function CompaniesPage({ applications }: { applications: JobApplication[] }) {
  const companies = initialCompanies.map((company) => {
    const related = applications.filter((app) => app.company === company.name);
    const responses = related.filter((app) => !['Applied', 'No response', 'Ghosted', 'Saved'].includes(app.status)).length;
    return { ...company, applications: related.length, responseRate: related.length ? Math.round((responses / related.length) * 100) : 0, lastStatus: related[0]?.status || 'Saved' as Status, lastApplication: related[0]?.dateApplied || '' };
  });
  return (
    <section className="page-section">
      <div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search companies..." /></div><button className="chip-button" type="button">Industry <ChevronDown size={15} /></button><button className="chip-button" type="button">Location <ChevronDown size={15} /></button><button className="primary-button" type="button"><Plus size={17} /> Add company later</button></div>
      <div className="company-grid">
        {companies.map((company) => (
          <article className="company-card panel-card" key={company.id}>
            <div className="company-card-top"><CompanyLogo name={company.name} domain={company.domain} large /><div><h2>{company.name}</h2><p>{company.industry}</p></div><button className="ghost-icon" type="button"><MoreHorizontal size={18} /></button></div>
            <div className="company-meta"><span><MapPin size={15} /> {company.location}</span><span><Globe size={15} /> {company.website}</span></div>
            <div className="company-stats"><div><strong>{company.applications}</strong><span>applications</span></div><div><strong>{company.responseRate}%</strong><span>response</span></div></div>
            <div className="company-footer"><StatusBadge status={company.lastStatus} /><span>{formatDate(company.lastApplication)}</span></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatisticsPage({ applications }: { applications: JobApplication[] }) {
  const stats = calculateStats(applications);
  const categoryRows = topRows(applications.map((app) => app.category));
  const levelRows = topRows(applications.map((app) => app.level));
  const sourceRows = topRows(applications.map((app) => app.source));
  return (
    <section className="page-section">
      <div className="toolbar compact-toolbar">{['Last 7 days', 'Last 30 days', 'This month', 'All time'].map((range, index) => <button className={`chip-button ${index === 3 ? 'selected' : ''}`} type="button" key={range}>{range}</button>)}</div>
      <div className="stats-metrics-grid">
        <MetricCard label="Total applications" value={stats.total} hint="all time" />
        <MetricCard label="Active processes" value={stats.active} hint="currently open" />
        <MetricCard label="Response rate" value={`${stats.responseRate}%`} hint="from all applications" tone="green-text" />
        <MetricCard label="Interview rate" value={`${stats.successRate}%`} hint="positive responses" tone="blue-text" />
        <MetricCard label="Ghosted" value={applications.filter((app) => app.status === 'Ghosted').length} hint="to archive" />
        <MetricCard label="Avg response time" value="6d" hint="first contact" />
      </div>
      <div className="stats-grid">
        <section className="panel-card chart-panel wide-chart"><div className="mini-title"><BarChart3 size={18} /><h2>Applications by category</h2></div><BarList rows={categoryRows} /></section>
        <ApplicationSummary applications={applications} />
        <section className="panel-card chart-panel"><div className="mini-title"><PieChart size={18} /><h2>Applications by level</h2></div><BarList rows={levelRows} /></section>
        <MiniListCard icon={Target} title="Best sources" rows={sourceRows} />
      </div>
    </section>
  );
}

function BarList({ rows }: { rows: [string, string][] }) {
  const max = Math.max(...rows.map(([, value]) => Number(value)), 1);
  return <div className="bar-chart-list">{rows.map(([label, value]) => <div className="bar-row" key={label}><span>{label}</span><div><span style={{ width: `${(Number(value) / max) * 100}%` }} /></div><strong>{value}</strong></div>)}</div>;
}

function CalendarPage() {
  const days = Array.from({ length: 35 }, (_, index) => index + 1);
  return (
    <section className="page-section">
      <div className="toolbar compact-toolbar">{['Month', 'Week', 'List'].map((item, index) => <button className={`chip-button ${index === 0 ? 'selected' : ''}`} key={item}>{item}</button>)}<button className="primary-button" type="button"><Plus size={17} /> Add event later</button></div>
      <div className="calendar-layout">
        <section className="panel-card calendar-card"><div className="calendar-header-row"><h2>May 2026</h2><div><button className="ghost-icon">‹</button><button className="ghost-icon">›</button></div></div><div className="calendar-grid-head">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid-days">{days.map((day) => <div className={`calendar-day ${[10, 20, 22, 28, 29, 31].includes(day) ? 'has-event' : ''}`} key={day}><span>{day}</span>{day === 28 ? <small>Technical</small> : null}{day === 29 ? <small>HR interview</small> : null}{day === 31 ? <small>Follow-up</small> : null}</div>)}</div></section>
        <section className="panel-card event-panel"><div className="mini-title"><CalendarDays size={18} /><h2>Upcoming events</h2></div>{upcomingEvents.map((event) => <div className="event-card" key={event.id}><span className="event-icon"><Clock size={16} /></span><div><strong>{event.title}</strong><p>{event.company}</p><small>{formatDate(event.date)}, {event.time}</small></div>{event.type.includes('interview') ? <Video size={16} /> : <Mail size={16} />}</div>)}</section>
      </div>
    </section>
  );
}

function DocumentsPage({ onExport }: { onExport: () => void }) {
  return (
    <section className="page-section">
      <div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search documents..." /></div><button className="secondary-button" type="button"><Upload size={17} /> Upload later</button><button className="secondary-button" type="button"><LinkIcon size={17} /> Add link later</button><button className="secondary-button" type="button" onClick={onExport}><Download size={17} /> Export CSV</button></div>
      <div className="document-grid">{documents.map((doc) => <article className="panel-card document-card" key={doc.id}><div className="document-icon"><FileText size={24} /></div><div><h2>{doc.name}</h2><p>{doc.type} · {doc.category}</p></div><div className="document-meta"><span>Updated {formatDate(doc.updated)}</span><span>Used in {doc.usedIn} applications</span><span>{doc.size}</span></div><div className="document-actions"><button className="ghost-icon" type="button"><Eye size={17} /></button><button className="ghost-icon" type="button"><Download size={17} /></button><button className="ghost-icon" type="button"><Pencil size={17} /></button></div></article>)}</div>
      <section className="panel-card insight-strip"><Sparkles size={18} /><span>Most used CV: <strong>CV_NET_Intern_2026.pdf</strong></span><span>Best response rate: <strong>CV_Cybersecurity_IAM_2026.pdf</strong></span></section>
    </section>
  );
}

function NotesPage({ notes, setNotes }: { notes: NoteItem[]; setNotes: (notes: NoteItem[]) => void }) {
  const [selectedId, setSelectedId] = useState(notes[0]?.id || 0);
  const selectedNote = notes.find((note) => note.id === selectedId) || notes[0];

  function updateBody(body: string) {
    setNotes(notes.map((note) => note.id === selectedNote.id ? { ...note, body, updated: new Date().toISOString().slice(0, 10) } : note));
  }

  function addNote() {
    const note: NoteItem = { id: Date.now(), title: 'New recruitment note', company: 'General', application: 'General', tag: 'Application notes', updated: new Date().toISOString().slice(0, 10), preview: 'Write your note here.', body: 'Start writing here.' };
    setNotes([note, ...notes]);
    setSelectedId(note.id);
  }

  if (!selectedNote) return null;

  return (
    <section className="page-section">
      <div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search notes..." /></div><button className="chip-button" type="button">Company <ChevronDown size={15} /></button><button className="chip-button" type="button">Tag <ChevronDown size={15} /></button><button className="primary-button" type="button" onClick={addNote}><Plus size={17} /> Add note</button></div>
      <div className="notes-layout">
        <aside className="panel-card notes-list">{notes.map((note) => <button key={note.id} className={`note-preview ${selectedNote.id === note.id ? 'active' : ''}`} type="button" onClick={() => setSelectedId(note.id)}><span><StickyNote size={17} /></span><div><strong>{note.title}</strong><small>{note.preview}</small></div></button>)}</aside>
        <section className="panel-card note-editor"><div className="note-editor-header"><div><h2>{selectedNote.title}</h2><p>{selectedNote.company} · {selectedNote.application}</p></div><div className="note-tags"><Tag size={15} /> {selectedNote.tag}</div></div><textarea value={selectedNote.body} onChange={(event) => updateBody(event.target.value)} /><div className="note-checklist"><h3><CheckSquare size={17} /> Checklist</h3>{['Prepare examples', 'Review company page', 'Write follow-up'].map((item) => <label key={item}><input type="checkbox" /> {item}</label>)}</div><div className="note-footer"><span>Last updated: {formatDate(selectedNote.updated)}</span><button className="primary-button" type="button"><CheckCircle2 size={17} /> Saved locally</button></div></section>
      </div>
    </section>
  );
}

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'preferences' | 'data';

function ProfileCustomizationModal({
  profile,
  setProfile,
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  onClose,
  onExport
}: {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onClose: () => void;
  onExport: () => void;
}) {
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
        <header className="modal-header"><div><h2>Profile & customization</h2><p>Manage your profile, preferences and app settings.</p></div><button className="close-button" type="button" onClick={onClose} aria-label="Close settings"><X size={20} /></button></header>
        <div className="modal-body">
          <aside className="modal-tabs">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} type="button" onClick={() => setActiveTab(tab.id)}><Icon size={17} /> {tab.label}</button>; })}</aside>
          <main className="modal-content custom-scroll">
            {activeTab === 'profile' ? <ProfileTab profile={profile} setProfile={setProfile} /> : null}
            {activeTab === 'appearance' ? <AppearanceTab theme={theme} setTheme={setTheme} /> : null}
            {activeTab === 'notifications' ? <NotificationsTab /> : null}
            {activeTab === 'preferences' ? <PreferencesTab /> : null}
            {activeTab === 'data' ? <DataTab onExport={onExport} /> : null}
          </main>
        </div>
        <footer className="modal-footer"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" onClick={onClose}><CheckCircle2 size={17} /> Save changes</button></footer>
      </section>
    </div>
  );
}

function ProfileTab({ profile, setProfile }: { profile: Profile; setProfile: (profile: Profile) => void }) {
  return (
    <div className="tab-content">
      <div className="profile-photo-row"><span className="profile-photo"><User size={31} /></span><div><h3>Profile photo</h3><p>Upload a photo or leave the default avatar.</p><button className="text-button strong" type="button">Change avatar later</button></div></div>
      <div className="form-grid">
        <Field label="Full name" value={profile.name} onChange={(value) => setProfile({ ...profile, name: value })} />
        <Field label="Email address" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />
        <Field label="Job search title" value={profile.title} onChange={(value) => setProfile({ ...profile, title: value })} />
        <Field label="Preferred location" value={profile.location} onChange={(value) => setProfile({ ...profile, location: value })} />
        <label className="form-field"><span>Preferred work mode</span><select value={profile.workMode} onChange={(event) => setProfile({ ...profile, workMode: event.target.value as WorkMode })}>{workModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="form-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function AppearanceTab({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return (
    <div className="tab-content">
      <div className="setting-group"><span className="setting-label">Theme</span><div className="segmented-row"><button className={theme === 'light' ? 'selected' : ''} type="button" onClick={() => setTheme('light')}><Sun size={16} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} type="button" onClick={() => setTheme('dark')}><Moon size={16} /> Dark</button><button type="button"><Monitor size={16} /> System</button></div></div>
      <div className="setting-group"><span className="setting-label">Accent color</span><div className="color-row">{['Taupe', 'Champagne', 'Dusty rose', 'Soft brown', 'Beige'].map((color) => <button className={`color-dot ${color.toLowerCase().replaceAll(' ', '-')}`} type="button" key={color}><span />{color}</button>)}</div></div>
      <div className="setting-group"><span className="setting-label">Layout density</span><div className="segmented-row"><button className="selected" type="button">Comfortable</button><button type="button">Compact</button></div></div>
      <ToggleRow title="Show motivational card in sidebar" text="Display desk inspiration card at the bottom of the sidebar." checked />
      <ToggleRow title="Enable subtle animations" text="Smooth transitions for cards, modals and page changes." checked />
    </div>
  );
}

function ToggleRow({ title, text, checked = false }: { title: string; text: string; checked?: boolean }) {
  const [enabled, setEnabled] = useState(checked);
  return <div className="toggle-row"><div><strong>{title}</strong><span>{text}</span></div><button className={`toggle ${enabled ? 'on' : ''}`} type="button" onClick={() => setEnabled((value) => !value)}><span /></button></div>;
}

function NotificationsTab() {
  return (
    <div className="tab-content narrow-settings">
      <ToggleRow title="Interview reminders" text="Remind me 24h and 1h before each interview." checked />
      <ToggleRow title="Follow-up reminders" text="Remind me to follow up after no response." checked />
      <ToggleRow title="Application deadlines" text="Alerts for deadlines set on offers." />
      <ToggleRow title="Weekly recruitment summary" text="Every Monday overview of the past week." checked />
      <ToggleRow title="Monthly statistics report" text="First of each month recruitment statistics." />
      <label className="form-field slim"><span>Default reminder time</span><select defaultValue="15 minutes before"><option>15 minutes before</option><option>1 hour before</option><option>1 day before</option></select></label>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="tab-content">
      <PreferenceGroup title="Preferred categories" items={categories.slice(0, 10)} selected={['.NET', 'Cybersecurity', 'IAM', 'DevOps']} />
      <PreferenceGroup title="Preferred job levels" items={levels} selected={['Internship', 'Intern', 'Junior', 'Junior-friendly']} />
      <div className="rules-grid"><label className="form-field"><span>Mark as no response after</span><input defaultValue="14" /></label><label className="form-field"><span>Mark as ghosted after</span><input defaultValue="30" /></label><label className="form-field"><span>Suggest follow-up after</span><input defaultValue="7" /></label></div>
    </div>
  );
}

function PreferenceGroup({ title, items, selected }: { title: string; items: string[]; selected: string[] }) {
  return <div className="preference-group"><span className="setting-label">{title}</span><div className="preference-pills">{items.map((item) => <button key={item} className={selected.includes(item) ? 'selected' : ''} type="button">{item}</button>)}</div></div>;
}

function DataTab({ onExport }: { onExport: () => void }) {
  const actions = [
    { title: 'Import CSV', text: 'Import applications from a CSV file.', icon: Upload, className: 'blue' },
    { title: 'Export CSV', text: 'Download all applications as a CSV file.', icon: Download, className: 'green', onClick: onExport },
    { title: 'Export PDF report', text: 'Generate a full recruitment PDF report later.', icon: FileText, className: 'beige' },
    { title: 'Backup data', text: 'Save a complete backup of your local demo data.', icon: Database, className: 'green' },
    { title: 'Delete all data', text: 'Reset local demo data. Cannot be undone.', icon: Trash2, className: 'danger' }
  ];
  return <div className="data-actions">{actions.map((action) => { const Icon = action.icon; return <button className="data-action" type="button" key={action.title} onClick={action.onClick}><span className={action.className}><Icon size={20} /></span><div><strong>{action.title}</strong><p>{action.text}</p></div></button>; })}</div>;
}

function AddApplicationModal({ onClose, onSave }: { onClose: () => void; onSave: (application: JobApplication) => void }) {
  const [form, setForm] = useState<Omit<JobApplication, 'id'>>({
    company: '', domain: '', position: '', category: '.NET', level: 'Internship', status: 'Applied', dateApplied: new Date().toISOString().slice(0, 10), lastContact: '', nextStep: 'Waiting', location: 'Warsaw', workMode: 'Hybrid', source: 'LinkedIn', offerUrl: '', requirements: '', benefits: '', notes: '', cv: 'CV_NET_Intern_2026.pdf'
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const domain = form.domain || safeDomain(form.company);
    onSave({ ...form, id: Date.now(), domain });
  }

  return (
    <div className="modal-backdrop">
      <section className="add-modal" role="dialog" aria-modal="true" aria-label="Add application">
        <header className="modal-header"><div><h2>Add application</h2><p>Create a new recruitment entry for your tracker.</p></div><button className="close-button" type="button" onClick={onClose}><X size={20} /></button></header>
        <form className="add-form custom-scroll" onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field"><span>Company name</span><input required value={form.company} onChange={(event) => set('company', event.target.value)} placeholder="e.g. Sii" /></label>
            <label className="form-field"><span>Company domain</span><input value={form.domain} onChange={(event) => set('domain', event.target.value)} placeholder="e.g. sii.pl" /></label>
            <label className="form-field"><span>Position</span><input required value={form.position} onChange={(event) => set('position', event.target.value)} placeholder="e.g. .NET Intern" /></label>
            <label className="form-field"><span>Offer URL</span><input value={form.offerUrl} onChange={(event) => set('offerUrl', event.target.value)} placeholder="https://..." /></label>
            <label className="form-field"><span>Category</span><select value={form.category} onChange={(event) => set('category', event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="form-field"><span>Level</span><select value={form.level} onChange={(event) => set('level', event.target.value)}>{levels.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="form-field"><span>Status</span><select value={form.status} onChange={(event) => set('status', event.target.value as Status)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="form-field"><span>Source</span><select value={form.source} onChange={(event) => set('source', event.target.value)}>{sources.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="form-field"><span>Location</span><input value={form.location} onChange={(event) => set('location', event.target.value)} /></label>
            <label className="form-field"><span>Work mode</span><select value={form.workMode} onChange={(event) => set('workMode', event.target.value as WorkMode)}>{workModes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="form-field"><span>Date applied</span><input type="date" value={form.dateApplied} onChange={(event) => set('dateApplied', event.target.value)} /></label>
            <label className="form-field"><span>Last contact</span><input type="date" value={form.lastContact} onChange={(event) => set('lastContact', event.target.value)} /></label>
            <label className="form-field"><span>Next step</span><input value={form.nextStep} onChange={(event) => set('nextStep', event.target.value)} /></label>
            <label className="form-field"><span>CV version</span><input value={form.cv} onChange={(event) => set('cv', event.target.value)} /></label>
          </div>
          <label className="form-field full-field"><span>Requirements</span><textarea value={form.requirements} onChange={(event) => set('requirements', event.target.value)} placeholder="C#, SQL, Git..." /></label>
          <label className="form-field full-field"><span>Benefits</span><textarea value={form.benefits} onChange={(event) => set('benefits', event.target.value)} placeholder="Hybrid work, mentoring..." /></label>
          <label className="form-field full-field"><span>Notes</span><textarea value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="What should you remember about this application?" /></label>
          <footer className="modal-footer inner"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><CheckCircle2 size={17} /> Save application</button></footer>
        </form>
      </section>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return <div className="toast"><CheckCircle2 size={17} /> {message}</div>;
}

function App() {
  const [isLoggedIn, setLoggedIn] = useState(() => readStorage(STORAGE_KEYS.session, false));
  const [profile, setProfileState] = useState<Profile>(() => readStorage(STORAGE_KEYS.profile, initialProfile));
  const [applications, setApplicationsState] = useState<JobApplication[]>(() => readStorage(STORAGE_KEYS.applications, initialApplications));
  const [notes, setNotesState] = useState<NoteItem[]>(() => readStorage(STORAGE_KEYS.notes, initialNotes));
  const [theme, setThemeState] = useState<Theme>(() => readStorage(STORAGE_KEYS.theme, 'light'));
  const [page, setPage] = useState<Page>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => writeStorage(STORAGE_KEYS.profile, profile), [profile]);
  useEffect(() => writeStorage(STORAGE_KEYS.applications, applications), [applications]);
  useEffect(() => writeStorage(STORAGE_KEYS.notes, notes), [notes]);
  useEffect(() => writeStorage(STORAGE_KEYS.theme, theme), [theme]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function setProfile(profileValue: Profile) {
    setProfileState(profileValue);
  }

  function setApplications(value: JobApplication[]) {
    setApplicationsState(value);
  }

  function setNotes(value: NoteItem[]) {
    setNotesState(value);
  }

  function setTheme(value: Theme) {
    setThemeState(value);
  }

  function openSettings(tab: SettingsTab = 'profile') {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  function login(profileValue: Profile) {
    setProfile(profileValue);
    setLoggedIn(true);
  }

  function logout() {
    writeStorage(STORAGE_KEYS.session, false);
    setLoggedIn(false);
  }

  function addApplication(application: JobApplication) {
    setApplications([application, ...applications]);
    setSelectedApplication(application);
    setPage('applications');
    setAddOpen(false);
    setToast('Application added and saved locally.');
  }

  function updateStatus(id: number, status: Status) {
    setApplications(applications.map((app) => app.id === id ? { ...app, status, lastContact: app.lastContact || new Date().toISOString().slice(0, 10) } : app));
    setToast('Status updated.');
  }

  function deleteApplication(id: number) {
    setApplications(applications.filter((app) => app.id !== id));
    if (selectedApplication?.id === id) setSelectedApplication(null);
    setToast('Application removed.');
  }

  function exportCsv() {
    const header = ['Company', 'Position', 'Category', 'Level', 'Status', 'Date applied', 'Last contact', 'Next step', 'Location', 'Work mode', 'Source', 'Offer URL'];
    const rows = applications.map((app) => [app.company, app.position, app.category, app.level, app.status, app.dateApplied, app.lastContact, app.nextStep, app.location, app.workMode, app.source, app.offerUrl]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trackmycv-applications.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast('CSV exported.');
  }

  if (!isLoggedIn) return <LoginPage onLogin={login} />;

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar page={page} setPage={setPage} applications={applications} />
      <div className="workspace">
        <Topbar page={page} profile={profile} theme={theme} setTheme={setTheme} onOpenApplication={() => setAddOpen(true)} onOpenSettings={openSettings} onLogout={logout} setPage={setPage} />
        <div className="content custom-scroll">
          {page !== 'dashboard' ? <PageHeader page={page} /> : null}
          {page === 'dashboard' ? <DashboardPage applications={applications} setPage={setPage} /> : null}
          {page === 'applications' ? <ApplicationsPage applications={applications} onOpenApplication={() => setAddOpen(true)} onStatusChange={updateStatus} onDelete={deleteApplication} selectedApplication={selectedApplication} setSelectedApplication={setSelectedApplication} onExport={exportCsv} /> : null}
          {page === 'companies' ? <CompaniesPage applications={applications} /> : null}
          {page === 'statistics' ? <StatisticsPage applications={applications} /> : null}
          {page === 'calendar' ? <CalendarPage /> : null}
          {page === 'documents' ? <DocumentsPage onExport={exportCsv} /> : null}
          {page === 'notes' ? <NotesPage notes={notes} setNotes={setNotes} /> : null}
        </div>
      </div>
      {settingsOpen ? <ProfileCustomizationModal profile={profile} setProfile={setProfile} activeTab={settingsTab} setActiveTab={setSettingsTab} theme={theme} setTheme={setTheme} onClose={() => setSettingsOpen(false)} onExport={exportCsv} /> : null}
      {addOpen ? <AddApplicationModal onClose={() => setAddOpen(false)} onSave={addApplication} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}

export default App;

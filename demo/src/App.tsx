import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Folder,
  Globe,
  Heart,
  LayoutDashboard,
  List as ListIcon,
  Link as LinkIcon,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Pencil,
  Pin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Sun,
  Tag,
  Table2,
  Trash2,
  Upload,
  User,
  Video,
  X
} from 'lucide-react';

type Page = 'dashboard' | 'applications' | 'companies' | 'statistics' | 'calendar' | 'documents' | 'notes' | 'ai';
type Theme = 'light' | 'dark';
type Status = 'Saved' | 'Applied' | 'In progress' | 'Interview' | 'Task / test' | 'Offer' | 'Rejected' | 'No response' | 'Ghosted' | 'Archived';
type WorkMode = 'Remote' | 'Hybrid' | 'On-site' | 'All work modes';
type CalendarView = 'Month' | 'Week' | 'List';
type ProfileTab = 'profile' | 'appearance' | 'notifications' | 'preferences' | 'data';
type DocKind = 'CV' | 'Cover letter' | 'Portfolio' | 'GitHub' | 'LinkedIn' | 'Job offer' | 'Task description' | 'Recruiter email' | 'Certificate' | 'Other';

type JobApplication = {
  id: number;
  company: string;
  companyId?: number;
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
  contact: string;
  notes: string;
};

type CalendarEvent = {
  id: number;
  title: string;
  company: string;
  applicationId?: number;
  date: string;
  time: string;
  type: string;
  location: string;
  meetingLink: string;
  notes: string;
};

type DocumentItem = {
  id: number;
  name: string;
  type: DocKind;
  category: string;
  updated: string;
  usedIn: number;
  size: string;
  url: string;
};

type ChecklistItem = {
  id: number;
  text: string;
  done: boolean;
};

type NoteItem = {
  id: number;
  title: string;
  company: string;
  application: string;
  tag: string;
  updated: string;
  body: string;
  checklist: ChecklistItem[];
};

type PreferredLocationPreference = {
  id: string;
  city: string;
  radiusKm: number;
};

type Profile = {
  name: string;
  email: string;
  title: string;
  location: string;
  portfolioUrl: string;
  linkedInUrl: string;
  githubUrl: string;
  workMode: WorkMode;
};

type AppSettings = {
  showMotivation: boolean;
  animations: boolean;
  density: 'Comfortable' | 'Compact';
  accent: 'Taupe' | 'Champagne' | 'Dusty rose' | 'Soft brown' | 'Beige';
  notifications: {
    interviews: boolean;
    followUps: boolean;
    deadlines: boolean;
    weekly: boolean;
    monthly: boolean;
    reminderTime: string;
  };
  preferences: {
    categories: string[];
    levels: string[];
    locations: string[];
    locationPreferences: PreferredLocationPreference[];
    workModes: WorkMode[];
    noResponseDays: number;
    ghostedDays: number;
    followUpDays: number;
  };
};

type AiTool = 'review' | 'cover' | 'scout';
type JobScoutTab = 'new' | 'saved' | 'ignored' | 'added' | 'history';
type JobScoutMatchStatus = 'new' | 'saved' | 'ignored' | 'added';
type JobScoutFrequency = 'Manual' | 'Daily' | 'Weekdays' | 'Weekly';
type JobScoutRunStatus = 'completed' | 'blocked' | 'failed';

type JobScoutMatch = {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  publishedAt: string;
  foundAt: string;
  source: string;
  sourceUrl: string;
  applyUrl: string;
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  gaps: string[];
  status: JobScoutMatchStatus;
};

type JobScoutRun = {
  id: string;
  startedAt: string;
  completedAt: string;
  status: JobScoutRunStatus;
  newMatches: number;
  message: string;
};

const STORAGE = {
  session: 'trackmycv.session.v3',
  profile: 'trackmycv.profile.v3',
  applications: 'trackmycv.applications.v3',
  companies: 'trackmycv.companies.v3',
  events: 'trackmycv.events.v3',
  documents: 'trackmycv.documents.v3',
  notes: 'trackmycv.notes.v3',
  settings: 'trackmycv.settings.v3',
  theme: 'trackmycv.theme.v3'
};

const statuses: Status[] = ['Saved', 'Applied', 'In progress', 'Interview', 'Task / test', 'Offer', 'Rejected', 'No response', 'Ghosted', 'Archived'];
const categories = ['.NET', 'C#', 'Cybersecurity', 'IAM', 'SOC', 'DevOps', 'React', 'Full-stack', 'Backend', 'Frontend', 'Data / AI', 'Support IT', 'Other'];
const levels = ['Internship', 'Intern', 'Trainee', 'Working Student', 'Junior', 'Junior-friendly', 'Mid', 'Senior'];
const allWorkModes: WorkMode = 'All work modes';
const workModes: WorkMode[] = ['Remote', 'Hybrid', 'On-site', allWorkModes];
const sources = ['LinkedIn', 'Just Join IT', 'Pracuj.pl', 'Company career page', 'No Fluff Jobs', 'AI Job Scout', 'Direct referral', 'Other'];
const eventTypes = ['HR interview', 'Technical interview', 'Recruitment task', 'Online test', 'Follow-up reminder', 'Application deadline', 'Company research', 'CV update reminder'];
const industries = ['Technology', 'Consulting', 'Software house', 'E-commerce', 'Banking', 'Cybersecurity', 'Other'];
const documentTypes: DocKind[] = ['CV', 'Cover letter', 'Portfolio', 'GitHub', 'LinkedIn', 'Job offer', 'Task description', 'Recruiter email', 'Certificate', 'Other'];

type ViteImportMeta = ImportMeta & {
  env?: {
    BASE_URL?: string;
  };
};

const publicAsset = (path: string) => {
  const baseUrl = ((import.meta as ViteImportMeta).env?.BASE_URL ?? '/').replace(/\/?$/, '/');
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
};

const initialProfile: Profile = {
  name: 'Demo User',
  email: 'demo@example.com',
  title: 'Software Engineering / Security Intern',
  location: 'Remote / Poland',
  portfolioUrl: 'https://example.com/portfolio',
  linkedInUrl: 'https://linkedin.com/in/demo-user',
  githubUrl: 'https://github.com/example-user',
  workMode: 'Hybrid'
};

const initialSettings: AppSettings = {
  showMotivation: true,
  animations: true,
  density: 'Comfortable',
  accent: 'Taupe',
  notifications: {
    interviews: true,
    followUps: true,
    deadlines: false,
    weekly: true,
    monthly: false,
    reminderTime: '15 minutes before'
  },
  preferences: {
    categories: ['.NET', 'Cybersecurity', 'IAM', 'DevOps'],
    levels: ['Internship', 'Intern', 'Junior', 'Junior-friendly'],
    locations: ['Warsaw', 'Krakow'],
    locationPreferences: [
      { id: 'location-warsaw', city: 'Warsaw', radiusKm: 30 },
      { id: 'location-krakow', city: 'Krakow', radiusKm: 40 }
    ],
    workModes: ['Hybrid', 'Remote', allWorkModes],
    noResponseDays: 14,
    ghostedDays: 30,
    followUpDays: 7
  }
};

const initialCompanies: Company[] = [
  { id: 1, name: 'Northstar Labs', domain: '', industry: 'Technology', location: 'Remote', website: 'https://example.com/northstar', contact: 'careers@example.com', notes: 'Fictional demo company for portfolio presentation.' },
  { id: 2, name: 'Riverstone Consulting', domain: '', industry: 'Consulting', location: 'Warsaw', website: 'https://example.com/riverstone', contact: 'recruitment@example.com', notes: 'Fictional consulting company with security roles.' },
  { id: 3, name: 'BrightPath Digital', domain: '', industry: 'Software house', location: 'Remote', website: 'https://example.com/brightpath', contact: '', notes: 'Fictional company used for demo data.' },
  { id: 4, name: 'Cloudberry Systems', domain: '', industry: 'Technology', location: 'KrakĂłw', website: 'https://example.com/cloudberry', contact: '', notes: 'Fictional cloud and DevOps company.' },
  { id: 5, name: 'Oak & Code', domain: '', industry: 'Software house', location: 'Remote', website: 'https://example.com/oak-code', contact: '', notes: 'Fictional software studio.' },
  { id: 6, name: 'Lumen Security', domain: '', industry: 'Cybersecurity', location: 'Warsaw', website: 'https://example.com/lumen-security', contact: '', notes: 'Fictional cybersecurity company.' },
  { id: 7, name: 'MapleWorks', domain: '', industry: 'E-commerce', location: 'Remote', website: 'https://example.com/mapleworks', contact: '', notes: 'Fictional product company.' }
];

const demoCompanyLogos: Record<string, { label: string; className: string }> = {
  'Northstar Labs': {
    label: 'N',
    className: 'northstar'
  },
  'Riverstone Consulting': {
    label: 'R',
    className: 'riverstone'
  },
  'BrightPath Digital': {
    label: 'B',
    className: 'brightpath'
  },
  'Cloudberry Systems': {
    label: 'C',
    className: 'cloudberry'
  },
  'Oak & Code': {
    label: 'O',
    className: 'oakcode'
  },
  'Lumen Security': {
    label: 'L',
    className: 'lumen'
  },
  MapleWorks: {
    label: 'M',
    className: 'mapleworks'
  }
};

const initialApplications: JobApplication[] = [
  { id: 1, company: 'Northstar Labs', companyId: 1, domain: '', position: '.NET Developer Intern', category: '.NET', level: 'Intern', status: 'Interview', dateApplied: '2026-05-20', lastContact: '2026-05-22', nextStep: 'Technical interview', location: 'Remote', workMode: 'Remote', source: 'LinkedIn', offerUrl: 'https://example.com/northstar/job-1', requirements: 'C#, .NET, SQL, REST API, Git', benefits: 'Mentoring, training budget, flexible work', notes: 'Demo note: prepare technical topics before the interview.', cv: 'CV_NET_Intern_Demo.pdf' },
  { id: 2, company: 'Riverstone Consulting', companyId: 2, domain: '', position: 'Cyber Security Analyst Intern', category: 'Cybersecurity', level: 'Internship', status: 'In progress', dateApplied: '2026-05-18', lastContact: '2026-05-20', nextStep: 'HR interview', location: 'Warsaw', workMode: 'Hybrid', source: 'Company career page', offerUrl: 'https://example.com/riverstone/job-2', requirements: 'IAM basics, security awareness, English, documentation', benefits: 'Learning path, mentor support, workshops', notes: 'Demo note: prepare motivation and security basics.', cv: 'CV_Security_Demo.pdf' },
  { id: 3, company: 'BrightPath Digital', companyId: 3, domain: '', position: 'IAM Intern', category: 'IAM', level: 'Intern', status: 'Applied', dateApplied: '2026-05-15', lastContact: '', nextStep: 'Waiting', location: 'Remote', workMode: 'Remote', source: 'LinkedIn', offerUrl: 'https://example.com/brightpath/job-3', requirements: 'Identity lifecycle, MFA, access management', benefits: 'Remote work, office events, training', notes: 'Demo note: good match for IAM interests.', cv: 'CV_Security_Demo.pdf' },
  { id: 4, company: 'Cloudberry Systems', companyId: 4, domain: '', position: 'Junior DevOps Engineer', category: 'DevOps', level: 'Junior-friendly', status: 'No response', dateApplied: '2026-05-10', lastContact: '', nextStep: 'Follow-up', location: 'KrakĂłw', workMode: 'Hybrid', source: 'Just Join IT', offerUrl: 'https://example.com/cloudberry/job-4', requirements: 'Docker, CI/CD, Linux, Git', benefits: 'Flexible hours, training, tech community', notes: 'Demo note: consider sending a follow-up.', cv: 'CV_General_IT_Demo.pdf' },
  { id: 5, company: 'Oak & Code', companyId: 5, domain: '', position: 'Junior Full-stack Developer', category: 'Full-stack', level: 'Junior', status: 'Rejected', dateApplied: '2026-05-05', lastContact: '2026-05-12', nextStep: 'Closed', location: 'Remote', workMode: 'Remote', source: 'Pracuj.pl', offerUrl: 'https://example.com/oak-code/job-5', requirements: 'C#, React, SQL, Git', benefits: 'Remote-first, workshops, team projects', notes: 'Demo note: add feedback and learning points here.', cv: 'CV_Fullstack_Demo.pdf' },
  { id: 6, company: 'Lumen Security', companyId: 6, domain: '', position: 'Security Internship', category: 'Cybersecurity', level: 'Internship', status: 'Ghosted', dateApplied: '2026-05-02', lastContact: '', nextStep: 'Archive or follow-up', location: 'Warsaw', workMode: 'Hybrid', source: 'No Fluff Jobs', offerUrl: 'https://example.com/lumen-security/job-6', requirements: 'Security basics, cloud basics, communication', benefits: 'Mentoring, certifications, hybrid work', notes: 'Demo note: no response after 30 days.', cv: 'CV_Security_Demo.pdf' },
  { id: 7, company: 'MapleWorks', companyId: 7, domain: '', position: 'Frontend Trainee', category: 'Frontend', level: 'Trainee', status: 'Offer', dateApplied: '2026-04-28', lastContact: '2026-05-07', nextStep: 'Decision', location: 'Remote', workMode: 'Remote', source: 'Direct referral', offerUrl: 'https://example.com/mapleworks/job-7', requirements: 'React, TypeScript, CSS, Git', benefits: 'Flexible work, product team, mentoring', notes: 'Demo note: strong frontend learning opportunity.', cv: 'CV_Frontend_Demo.pdf' }
];

const initialEvents: CalendarEvent[] = [
  { id: 1, title: 'Technical interview', company: 'Northstar Labs', applicationId: 1, date: '2026-05-28', time: '10:00', type: 'Technical interview', location: 'Online', meetingLink: 'https://example.com/meeting', notes: 'Demo event: prepare technical questions.' },
  { id: 2, title: 'HR interview', company: 'Riverstone Consulting', applicationId: 2, date: '2026-05-29', time: '14:00', type: 'HR interview', location: 'Online', meetingLink: 'https://example.com/meeting', notes: 'Demo event: prepare motivation and questions.' },
  { id: 3, title: 'Follow-up', company: 'Cloudberry Systems', applicationId: 4, date: '2026-05-31', time: '09:00', type: 'Follow-up reminder', location: 'Email', meetingLink: '', notes: 'Demo event: send a short follow-up.' },
  { id: 4, title: 'Online test', company: 'BrightPath Digital', applicationId: 3, date: '2026-06-02', time: '16:00', type: 'Online test', location: 'Online', meetingLink: '', notes: 'Demo event: complete online test.' }
];

const initialDocuments: DocumentItem[] = [
  { id: 1, name: 'CV_NET_Intern_Demo.pdf', type: 'CV', category: '.NET', updated: '2026-05-18', usedIn: 5, size: '420 KB', url: '' },
  { id: 2, name: 'CV_Security_Demo.pdf', type: 'CV', category: 'Cybersecurity', updated: '2026-05-19', usedIn: 4, size: '436 KB', url: '' },
  { id: 3, name: 'CV_Fullstack_Demo.pdf', type: 'CV', category: 'Full-stack', updated: '2026-05-12', usedIn: 2, size: '448 KB', url: '' },
  { id: 4, name: 'Cover_Letter_Demo.pdf', type: 'Cover letter', category: 'General', updated: '2026-05-18', usedIn: 1, size: '198 KB', url: '' },
  { id: 5, name: 'Portfolio_Demo_Link', type: 'Portfolio', category: 'General', updated: '2026-05-20', usedIn: 7, size: 'URL', url: 'https://example.com/portfolio' },
  { id: 6, name: 'GitHub_Demo_Profile', type: 'GitHub', category: 'General', updated: '2026-05-20', usedIn: 7, size: 'URL', url: 'https://github.com/example-user' }
];

const jobScoutTabs: { id: JobScoutTab; label: string }[] = [
  { id: 'new', label: 'New matches' },
  { id: 'saved', label: 'Saved' },
  { id: 'ignored', label: 'Ignored' },
  { id: 'added', label: 'Added to applications' },
  { id: 'history', label: 'Search history' }
];

const initialJobScoutMatches: JobScoutMatch[] = [
  {
    id: 'scout-match-1',
    title: 'Junior .NET Developer Intern',
    company: 'Campgemini Demo',
    location: 'Warsaw + remote',
    workMode: 'Hybrid',
    publishedAt: '2026-07-19',
    foundAt: '2026-07-20',
    source: 'Company careers RSS',
    sourceUrl: 'https://example.com/campgemini-careers',
    applyUrl: 'https://example.com/campgemini-dotnet-intern',
    matchScore: 92,
    matchReason: 'Strong match for .NET, C#, SQL and internship-level preferences, with hybrid Warsaw work fitting the profile radius.',
    matchedSkills: ['C#', '.NET', 'SQL', 'Git', 'REST API'],
    gaps: ['Azure basics'],
    status: 'new'
  },
  {
    id: 'scout-match-2',
    title: 'IAM Analyst Working Student',
    company: 'Lumen Security',
    location: 'Remote',
    workMode: 'Remote',
    publishedAt: '2026-07-18',
    foundAt: '2026-07-20',
    source: 'No Fluff Jobs feed',
    sourceUrl: 'https://example.com/lumen-iam-feed',
    applyUrl: 'https://example.com/lumen-iam-working-student',
    matchScore: 87,
    matchReason: 'Matches IAM and cybersecurity preferences, junior-friendly level and remote work mode.',
    matchedSkills: ['IAM', 'MFA', 'Documentation', 'Security basics'],
    gaps: ['Okta experience'],
    status: 'new'
  },
  {
    id: 'scout-match-3',
    title: 'Junior DevOps Trainee',
    company: 'Cloudberry Systems',
    location: 'Krakow + 40 km',
    workMode: 'Hybrid',
    publishedAt: '2026-07-17',
    foundAt: '2026-07-20',
    source: 'Just Join IT API',
    sourceUrl: 'https://example.com/cloudberry-devops-api',
    applyUrl: 'https://example.com/cloudberry-devops-trainee',
    matchScore: 79,
    matchReason: 'Good fit for DevOps and junior-friendly preferences, but less aligned with primary .NET focus.',
    matchedSkills: ['Docker', 'Git', 'Linux', 'CI/CD'],
    gaps: ['Kubernetes'],
    status: 'saved'
  },
  {
    id: 'scout-match-4',
    title: 'Senior Backend Engineer',
    company: 'Oak & Code',
    location: 'Remote',
    workMode: 'Remote',
    publishedAt: '2026-07-16',
    foundAt: '2026-07-19',
    source: 'Company careers RSS',
    sourceUrl: 'https://example.com/oak-code-feed',
    applyUrl: 'https://example.com/oak-code-senior-backend',
    matchScore: 41,
    matchReason: 'Tech stack overlaps, but seniority is far above current preferred levels.',
    matchedSkills: ['C#', 'REST API', 'SQL'],
    gaps: ['Senior experience', 'System design ownership'],
    status: 'ignored'
  }
];

const initialJobScoutRuns: JobScoutRun[] = [
  {
    id: 'scout-run-demo-1',
    startedAt: '2026-07-20T09:00:00.000Z',
    completedAt: '2026-07-20T09:01:00.000Z',
    status: 'completed',
    newMatches: 2,
    message: 'Demo search checked 4 connected mock sources, deduplicated 3 repeats and found 2 new matches above threshold.'
  },
  {
    id: 'scout-run-demo-2',
    startedAt: '2026-07-19T09:00:00.000Z',
    completedAt: '2026-07-19T09:01:00.000Z',
    status: 'completed',
    newMatches: 1,
    message: 'Daily demo search found one saved DevOps trainee role and ignored one senior mismatch.'
  }
];

const initialNotes: NoteItem[] = [
  { id: 1, title: 'HR interview preparation', company: 'Riverstone Consulting', application: 'Cyber Security Analyst Intern', tag: 'Interview preparation', updated: '2026-05-21', body: 'Demo note: prepare a short introduction, motivation, project examples and questions to the recruiter.', checklist: [{ id: 1, text: 'Prepare short intro', done: true }, { id: 2, text: 'Revise role requirements', done: false }, { id: 3, text: 'Prepare questions to recruiter', done: false }] },
  { id: 2, title: 'Security topics to revise', company: 'BrightPath Digital', application: 'IAM Intern', tag: 'Technical questions', updated: '2026-05-20', body: 'Demo note: revise authentication, authorization, MFA, identity lifecycle and access management basics.', checklist: [{ id: 1, text: 'Authentication vs authorization', done: false }, { id: 2, text: 'MFA basics', done: false }] },
  { id: 3, title: '.NET technical questions', company: 'Northstar Labs', application: '.NET Developer Intern', tag: 'Technical questions', updated: '2026-05-22', body: 'Demo note: review OOP, dependency injection, async/await, REST endpoints and database basics.', checklist: [{ id: 1, text: 'Dependency injection', done: true }, { id: 2, text: 'async/await', done: false }, { id: 3, text: 'REST API basics', done: false }] }
];

const inspirationCards = [
  { title: 'Stay consistent', text: 'Small steps every day lead to big changes.', image: publicAsset('assets/bed-coffe.jpg') },
  { title: 'Slow progress counts', text: 'One thoughtful application is still progress.', image: publicAsset('assets/cofee-photo2.webp') },
  { title: 'Keep it soft', text: 'You do not need chaos to move forward.', image: publicAsset('assets/candle-vanilla.jpg') },
  { title: 'Tiny wins matter', text: 'A saved offer, a sent CV, a follow-up â€” all count.', image: publicAsset('assets/croissant-bow.jpg') },
  { title: 'Protect your energy', text: 'Not every rejection says something about you.', image: publicAsset('assets/cat-bed.jpg') },
  { title: 'One clean step', text: 'Today can be only one application. That is enough.', image: publicAsset('assets/cozy-home.jpg') },
  { title: 'Stay curious', text: 'Every offer teaches you what to learn next.', image: publicAsset('assets/desk-photo2.jpg') },
  { title: 'Reset gently', text: 'A quiet break can make the next step clearer.', image: publicAsset('assets/coffee-metal.jpg') },
  { title: 'No rush, still moving', text: 'Consistency is calmer than pressure.', image: publicAsset('assets/pancake.jpg') },
  { title: 'Focus on fit', text: 'The right process should feel possible, not impossible.', image: publicAsset('assets/work2.webp') },
  { title: 'Cozy focus', text: 'A clear space helps a clear next step.', image: publicAsset('assets/work3.webp') },
  { title: 'Gentle discipline', text: 'You can be ambitious without rushing yourself.', image: publicAsset('assets/cat.jpg') },
  { title: 'Make it manageable', text: 'Break the search into small warm rituals.', image: publicAsset('assets/cofee-photo.webp') },
  { title: 'Warm reset', text: 'Rest is part of staying consistent.', image: publicAsset('assets/cozy-home.jpg') },
  { title: 'Soft confidence', text: 'Your path can be calm and still serious.', image: publicAsset('assets/work1.jpg') }
];

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', icon: BriefcaseBusiness },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'ai', label: 'AI Tools', icon: Sparkles },
  { id: 'notes', label: 'Notes', icon: StickyNote }
];

const pageLabels: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Hereâ€™s an overview of your recruitment progress.' },
  applications: { title: 'Applications', subtitle: 'Manage your job applications and recruitment stages.' },
  companies: { title: 'Companies', subtitle: 'Track companies, previous applications and recruitment history.' },
  statistics: { title: 'Statistics', subtitle: 'Analyze your application progress and discover what works best.' },
  calendar: { title: 'Calendar', subtitle: 'Plan interviews, follow-ups and recruitment tasks.' },
  documents: { title: 'Documents', subtitle: 'Manage CV versions, cover letters and application files.' },
  ai: { title: 'AI Tools', subtitle: 'Review CVs, draft cover letters and scout matching jobs in the demo.' },
  notes: { title: 'Notes', subtitle: 'Keep recruitment notes, interview questions and company research in one place.' }
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeProfile(value?: Partial<Profile> | null): Profile {
  return { ...initialProfile, ...(value ?? {}) };
}

function normalizeSettings(value?: Partial<AppSettings> | null): AppSettings {
  const preferences: Partial<AppSettings['preferences']> = value?.preferences ?? {};
  const rawLocationPreferences = preferences.locationPreferences?.length
    ? preferences.locationPreferences
    : (preferences.locations?.length ? preferences.locations : initialSettings.preferences.locations).map((city: string, index: number) => ({
      id: `location-${index + 1}`,
      city,
      radiusKm: 30
    }));

  return {
    ...initialSettings,
    ...(value ?? {}),
    notifications: {
      ...initialSettings.notifications,
      ...(value?.notifications ?? {})
    },
    preferences: {
      ...initialSettings.preferences,
      ...preferences,
      locationPreferences: rawLocationPreferences
        .filter((location: PreferredLocationPreference) => location.city && location.city.toLowerCase() !== 'remote')
        .map((location: PreferredLocationPreference, index: number) => ({
          id: location.id || `location-${index + 1}`,
          city: location.city,
          radiusKm: Math.min(500, Math.max(0, Math.round(Number(location.radiusKm) || 30)))
        }))
    }
  };
}

function formatDate(value: string) {
  if (!value) return 'â€”';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatDateTime(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toIsoDate(date: Date) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(value: string | Date) {
  const date = typeof value === 'string' ? toDate(value) : new Date(value);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(12, 0, 0, 0);
  return date;
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
  return `${formatter.format(start)} â€“ ${formatter.format(end)}`;
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date);
}

function startOfMonth(value: string | Date) {
  const date = typeof value === 'string' ? toDate(value) : new Date(value);
  date.setDate(1);
  date.setHours(12, 0, 0, 0);
  return date;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  next.setDate(1);
  next.setHours(12, 0, 0, 0);
  return next;
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date);
}

function getMonthCells(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const firstGridDay = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstGridDay, index);
    return {
      date,
      iso: toIsoDate(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth()
    };
  });
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function safeDomain(company: string, domain?: string) {
  if (domain?.trim()) return domain.replace(/^https?:\/\//, '').replace(/\/.*/, '');
  return `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
}

function getStatusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '').replace(/[^a-z-]/g, '');
}

function pickInspiration() {
  return inspirationCards[Math.floor(Math.random() * inspirationCards.length)];
}

function topRows(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value || 'Other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => [label, String(value)] as [string, string]);
}

function uniqueOptions(...lists: string[][]) {
  return Array.from(new Set(lists.flat().filter(Boolean)));
}

function calculateStats(applications: JobApplication[]) {
  const total = applications.length;
  const active = applications.filter((app) => ['Applied', 'In progress', 'Interview', 'Task / test'].includes(app.status)).length;
  const interviews = applications.filter((app) => ['Interview', 'Offer'].includes(app.status)).length;
  const positive = applications.filter((app) => ['Interview', 'Task / test', 'Offer', 'In progress'].includes(app.status)).length;
  const response = applications.filter((app) => !['Saved', 'Applied', 'No response', 'Ghosted', 'Archived'].includes(app.status)).length;
  const responseRate = total ? Math.round((response / total) * 100) : 0;
  const successRate = total ? Math.round((positive / total) * 100) : 0;
  return { total, active, interviews, positive, responseRate, successRate };
}

function companyStats(company: Company, applications: JobApplication[]) {
  const related = applications.filter((app) => app.company === company.name || app.companyId === company.id);
  const responses = related.filter((app) => !['Saved', 'Applied', 'No response', 'Ghosted', 'Archived'].includes(app.status)).length;
  return {
    count: related.length,
    responseRate: related.length ? Math.round((responses / related.length) * 100) : 0,
    lastStatus: related[0]?.status || 'Saved',
    lastDate: related[0]?.dateApplied || ''
  };
}

function exportCsv(applications: JobApplication[], setToast: (value: string) => void) {
  const header = ['Company', 'Position', 'Category', 'Level', 'Status', 'Date applied', 'Last contact', 'Next step', 'Location', 'Work mode', 'Source', 'Offer URL'];
  const rows = applications.map((app) => [app.company, app.position, app.category, app.level, app.status, app.dateApplied, app.lastContact, app.nextStep, app.location, app.workMode, app.source, app.offerUrl]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trackmycv-applications.csv';
  link.click();
  URL.revokeObjectURL(url);
  setToast('CSV exported.');
}

function downloadJson(filename: string, data: unknown, setToast: (value: string) => void) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  setToast('Backup downloaded.');
}

function CompanyLogo({
  name,
  domain,
  large = false
}: {
  name: string;
  domain?: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const demoLogo = demoCompanyLogos[name];
  const cleanDomain = domain?.trim();

  if (demoLogo) {
    return (
      <span
        className={`company-logo demo-company-logo ${demoLogo.className} ${large ? 'large' : ''}`}
        aria-label={`${name} logo`}
      >
        <span>{demoLogo.label}</span>
      </span>
    );
  }

  if (cleanDomain && !failed) {
    const resolvedDomain = safeDomain(name, cleanDomain);

    return (
      <span className={`company-logo ${large ? 'large' : ''}`} aria-label={`${name} logo`}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=64`}
          alt=""
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={`company-logo demo-company-logo fallback ${large ? 'large' : ''}`} aria-label={`${name} logo`}>
      <span>{getInitials(name)}</span>
    </span>
  );
}

function Logo() {
  return (
    <div className="brand">
      <div className="brand-icon logo-image-shell" aria-hidden="true">
        <img src={publicAsset('logo/logo-removebg.png')} alt="" className="brand-logo-img" />
      </div>
      <div><div className="brand-name">TrackMyCV</div><div className="brand-subtitle">Job tracker</div></div>
    </div>
  );
}

function CustomSelect({ label, value, options, onChange, className = '' }: { label?: string; value: string; options: string[]; onChange: (value: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className={`custom-select ${className}`} ref={ref}>
      <button type="button" className={`select-trigger ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)}>
        {label ? <span>{label}</span> : null}<strong>{value}</strong><ChevronDown size={15} />
      </button>
      {open ? (
        <div className="select-menu custom-scroll">
          {options.map((option) => (
            <button key={option} type="button" className={option === value ? 'selected' : ''} onClick={() => { onChange(option); setOpen(false); }}>
              <span>{option}</span>{option === value ? <Check size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="form-field"><span>{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function NumberStepper({ label, value, onChange, min = 0, max = 365, unit = 'days' }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; unit?: string }) {
  const current = Number.isFinite(value) ? Math.round(value) : min;

  function update(nextValue: number) {
    onChange(Math.min(max, Math.max(min, Math.round(nextValue))));
  }

  return (
    <div className="number-stepper">
      <span>{label}</span>
      <div className="number-stepper-control">
        <input
          aria-label={label}
          inputMode="numeric"
          value={String(current)}
          onChange={(event) => {
            const parsed = Number(event.target.value.replace(/[^\d-]/g, ''));
            if (Number.isFinite(parsed)) update(parsed);
          }}
        />
        <em>{unit}</em>
        <div className="number-stepper-buttons">
          <button type="button" aria-label={`Increase ${label}`} onClick={() => update(current + 1)}><ChevronUp size={14} /></button>
          <button type="button" aria-label={`Decrease ${label}`} onClick={() => update(current - 1)}><ChevronDown size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="form-field full-field"><span>{label}</span><textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function LoginPage({ onLogin }: { onLogin: (profile: Profile) => void }) {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes('@') || password.length < 4) {
      setError('Podaj poprawny e-mail i hasĹ‚o minimum 4 znaki.');
      return;
    }
    const next = { ...initialProfile, email };
    writeStorage(STORAGE.session, true);
    writeStorage(STORAGE.profile, next);
    onLogin(next);
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <Logo />
        <div className="login-copy"><span className="eyebrow">Live demo</span><h1>Track applications without chaos.</h1><p>Mockup dziaĹ‚a lokalnie w przeglÄ…darce: moĹĽesz dodawaÄ‡, edytowaÄ‡, filtrowaÄ‡ i zapisywaÄ‡ dane w localStorage.</p></div>
        <form className="login-form" onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button full" type="submit">Log in</button>
          <small>Demo accepts any e-mail and password with at least 4 characters.</small>
        </form>
      </section>
      <aside className="login-visual"><img src={publicAsset('assets/work2.webp')} alt="Soft work setup" /><div className="visual-card"><CheckCircle2 size={18} /> Soft productivity dashboard</div></aside>
    </main>
  );
}

function Sidebar({ page, setPage, applications, settings }: { page: Page; setPage: (page: Page) => void; applications: JobApplication[]; settings: AppSettings }) {
  const [inspiration, setInspiration] = useState(() => pickInspiration());
  const activeCount = applications.filter((app) => !['Rejected', 'Ghosted', 'Archived'].includes(app.status)).length;
  const upcomingCount = applications.filter((app) => ['Interview', 'Task / test'].includes(app.status)).length;
  useEffect(() => {
    const interval = window.setInterval(() => setInspiration(pickInspiration()), 45000);
    return () => window.clearInterval(interval);
  }, []);
  return (
    <aside className="sidebar custom-scroll">
      <Logo />
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const badge = item.id === 'applications' ? activeCount : item.id === 'calendar' ? upcomingCount : 0;
          return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} type="button" onClick={() => setPage(item.id)}><Icon size={18} /><span>{item.label}</span>{badge ? <span className="nav-badge">{badge}</span> : null}</button>;
        })}
      </nav>
      {settings.showMotivation ? (
        <div className="sidebar-card inspiration-card">
          <div className="inspiration-image"><img src={inspiration.image} alt="Soft cozy inspiration" /></div>
          <h3>{inspiration.title}</h3>
          <p>{inspiration.text}</p>
          <button className="inspiration-action" type="button" onClick={() => setInspiration(pickInspiration())} aria-label="Show another thought"><Heart size={18} /><span>New thought</span></button>
        </div>
      ) : null}
    </aside>
  );
}

function Topbar({ page, profile, theme, setTheme, onOpenApplication, onOpenSettings, onLogout, setPage }: { page: Page; profile: Profile; theme: Theme; setTheme: (theme: Theme) => void; onOpenApplication: () => void; onOpenSettings: (tab?: ProfileTab) => void; onLogout: () => void; setPage: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const isDashboard = page === 'dashboard';
  const firstName = profile.name.split(' ')[0] || 'Demo';
  const pageMeta = pageLabels[page];
  const title = isDashboard ? `Good morning, ${firstName}` : pageMeta.title;
  const subtitle = isDashboard ? "Here's an overview of your recruitment progress." : pageMeta.subtitle;
  function openSettings(tab: ProfileTab) {
    setOpen(false);
    onOpenSettings(tab);
  }
  return (
    <header className="topbar">
      <div className="topbar-title"><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Search" onClick={() => setPage('applications')}><Search size={19} /></button>
        <button className="icon-button with-dot" type="button" aria-label="Notifications" onClick={() => openSettings('notifications')}><Bell size={19} /></button>
        <button className="icon-button" type="button" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button>
        <div className="profile-wrap">
          <button className={`profile-button ${open ? 'open' : ''}`} type="button" onClick={() => setOpen((v) => !v)}><span className="avatar-soft"><User size={18} /></span><span>{firstName}</span><ChevronDown size={16} className={open ? 'rotated' : ''} /></button>
          {open ? <div className="profile-menu"><div className="profile-menu-header"><strong>{profile.name}</strong><span>{profile.email}</span></div><button type="button" onClick={() => openSettings('profile')}><User size={17} /> Profile</button><button type="button" onClick={() => openSettings('appearance')}><Palette size={17} /> Appearance</button><button type="button" onClick={() => openSettings('notifications')}><Bell size={17} /> Notifications</button><button type="button" onClick={() => openSettings('preferences')}><SlidersHorizontal size={17} /> Preferences</button><button type="button" onClick={() => openSettings('data')}><Download size={17} /> Data & export</button><button type="button" className="danger-link" onClick={onLogout}><LogOut size={17} /> Log out</button></div> : null}
        </div>
        <button className="primary-button" type="button" onClick={onOpenApplication}><Plus size={18} /> Add application</button>
        <button className="secondary-button" type="button" onClick={() => setPage('applications')}><Filter size={18} /> Filter</button>
      </div>
    </header>
  );
}

function PageHeader({ page }: { page: Page }) {
  const meta = pageLabels[page];
  return <header className="page-header"><div><h1>{meta.title}</h1><p>{meta.subtitle}</p></div></header>;
}

function MetricCard({ label, value, hint, tone = '' }: { label: string; value: string | number; hint: string; tone?: string }) {
  return <div className="metric-card"><span>{label}</span><strong className={tone}>{value}</strong><small>{hint}</small></div>;
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-${getStatusClass(status)}`}>{status}</span>;
}

function CategoryPill({ category }: { category: string }) {
  return <span className="category-pill">{category}</span>;
}

function DashboardPage({ applications, events, setPage }: { applications: JobApplication[]; events: CalendarEvent[]; setPage: (page: Page) => void }) {
  const stats = calculateStats(applications);
  const latest = [...applications].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied)).slice(0, 5);
  return (
    <div className="page-grid dashboard-grid">
      <main className="main-column">
        <div className="metrics-grid"><MetricCard label="Total applied" value={stats.total} hint="all time" /><MetricCard label="Active" value={stats.active} hint="in progress" tone="blue-text" /><MetricCard label="Interviews" value={stats.interviews} hint="positive stages" tone="rose-text" /><MetricCard label="Response rate" value={`${stats.responseRate}%`} hint="from all applications" tone="green-text" /></div>
        <section className="panel-card recent-panel"><div className="card-header"><div><h2>Recent applications</h2><p>5 most recent entries</p></div><button className="text-button" type="button" onClick={() => setPage('applications')}>View all <ChevronDown className="chevron-right" size={16} /></button></div><ApplicationsTable applications={latest} compact /></section>
        <div className="small-card-grid"><MiniListCard icon={Building2} title="Top companies" rows={topRows(applications.map((app) => app.company))} /><MiniListCard icon={BriefcaseBusiness} title="Top categories" rows={topRows(applications.map((app) => app.category))} /><MiniListCard icon={Globe} title="Sources" rows={topRows(applications.map((app) => app.source))} /></div>
      </main>
      <aside className="right-column"><ApplicationSummary applications={applications} /><SuccessRateCard applications={applications} /><UpcomingCard events={events} onOpenCalendar={() => setPage('calendar')} /></aside>
    </div>
  );
}

function MiniListCard({ icon: Icon, title, rows }: { icon: typeof Building2; title: string; rows: [string, string][] }) {
  return <section className="panel-card mini-list-card"><div className="mini-title"><Icon size={17} /><h2>{title}</h2></div>{rows.map(([label, value]) => <div className="mini-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}<button className="mini-link" type="button">View all</button></section>;
}

function ApplicationSummary({ applications }: { applications: JobApplication[] }) {
  const visibleStatuses: Status[] = ['Applied', 'In progress', 'Interview', 'Offer', 'Rejected', 'No response', 'Ghosted'];
  const rows = visibleStatuses
    .map((status) => [status, applications.filter((app) => app.status === status).length] as [Status, number])
    .filter(([, count]) => count > 0);
  const total = applications.length;
  const colors: Record<string, string> = {
    Applied: '#c89561',
    'In progress': '#7f9eb6',
    Interview: '#cf8060',
    Offer: '#7ea86f',
    Rejected: '#c36d70',
    'No response': '#9b9890',
    Ghosted: '#aaa184',
    Saved: '#cbbba5',
    'Task / test': '#b68a61',
    Archived: '#8b837a'
  };

  let cursor = 0;
  const gradient = rows.length
    ? `conic-gradient(${rows.map(([status, count]) => {
        const start = cursor;
        const end = cursor + (count / Math.max(total, 1)) * 100;
        cursor = end;
        return `${colors[status]} ${start}% ${end}%`;
      }).join(', ')})`
    : 'conic-gradient(var(--surface-3) 0% 100%)';

  return (
    <section className="panel-card summary-card">
      <h2>Application summary</h2>
      <p>{total} total applications</p>
      <div className="summary-content">
        <div className="donut-visual" aria-hidden="true" style={{ background: gradient }}>
          <div className="donut-hole">
            <strong>{total}</strong>
            <span>apps</span>
          </div>
        </div>
        <div className="legend-list">
          {rows.map(([status, count]) => (
            <div key={status} className="legend-item">
              <span className="legend-dot" style={{ background: colors[status] }} />
              <span className="legend-label">{status}</span>
              <strong>{count}</strong>
            </div>
          ))}
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
      <div className="success-content">
        <strong>{stats.successRate}%</strong>
        <span className="positive-trend"><Sparkles size={15} /> +15%</span>
      </div>
      <p>{stats.positive} positive responses from {stats.total} applications</p>
      <svg className="success-sparkline" viewBox="0 0 260 72" aria-hidden="true" preserveAspectRatio="none">
        <path className="sparkline-fill" d="M0 60 C28 42 44 62 70 44 C98 25 118 58 148 38 C177 18 196 56 225 29 C240 14 251 24 260 18 L260 72 L0 72 Z" />
        <path className="sparkline-line" d="M0 60 C28 42 44 62 70 44 C98 25 118 58 148 38 C177 18 196 56 225 29 C240 14 251 24 260 18" />
      </svg>
    </section>
  );
}

function UpcomingCard({ events, onOpenCalendar }: { events: CalendarEvent[]; onOpenCalendar: () => void }) {
  const upcoming = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 3);
  return <section className="panel-card upcoming-card"><div className="mini-title"><CalendarDays size={17} /><h2>Upcoming</h2></div>{upcoming.map((event) => <div className="event-row" key={event.id}><span className="event-icon"><CalendarDays size={15} /></span><div><strong>{event.title} â€” {event.company}</strong><small>{formatDate(event.date)}, {event.time}</small></div></div>)}<button className="mini-link with-arrow" type="button" onClick={onOpenCalendar}>View calendar <ChevronDown className="chevron-right" size={16} /></button></section>;
}

function ApplicationsTable({
  applications,
  compact = false,
  selectedId,
  onSelect,
  onStatusChange,
  onDelete,
  onEdit
}: {
  applications: JobApplication[];
  compact?: boolean;
  selectedId?: number;
  onSelect?: (application: JobApplication) => void;
  onStatusChange?: (id: number, status: Status) => void;
  onDelete?: (id: number) => void;
  onEdit?: (application: JobApplication) => void;
}) {
  return (
    <div className="table-wrap custom-scroll">
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
            <tr
              key={app.id}
              className={selectedId === app.id ? 'selected-row' : ''}
              onClick={() => onSelect?.(app)}
            >
              <td>
                <div className="company-cell">
                  <CompanyLogo name={app.company} domain={app.domain} />
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
                {onStatusChange && !compact ? (
                  <select
                    className={`status-table-select status-${getStatusClass(app.status)}`}
                    value={app.status}
                    aria-label={`Change status for ${app.company}`}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onStatusChange(app.id, event.target.value as Status)}
                  >
                    {statuses.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={app.status} />
                )}
              </td>

              <td>{formatDate(app.dateApplied)}</td>

              {!compact ? <td>{app.workMode}</td> : null}
              {!compact ? <td>{formatDate(app.lastContact)}</td> : null}

              <td className="next-step-cell">{app.nextStep}</td>

              {!compact ? (
                <td className="row-actions">
                  <div className="row-actions-inner">
                    <button
                      className="ghost-icon"
                      type="button"
                      aria-label="Edit"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit?.(app);
                      }}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="ghost-icon"
                      type="button"
                      aria-label="Open offer"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (app.offerUrl) window.open(app.offerUrl, '_blank');
                      }}
                    >
                      <ExternalLink size={17} />
                    </button>

                    <button
                      className="ghost-icon danger"
                      type="button"
                      aria-label="Delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(app.id);
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {!applications.length ? (
        <div className="empty-state">
          <Folder size={28} />
          <strong>No results</strong>
          <span>Try changing filters or add a new application.</span>
        </div>
      ) : null}
    </div>
  );
}

function ApplicationsPage({
  applications,
  onOpenApplication,
  onOpenEditApplication,
  onStatusChange,
  onDelete,
  selectedApplication,
  setSelectedApplication,
  onExport,
  categoryOptions,
  levelOptions
}: {
  applications: JobApplication[];
  onOpenApplication: () => void;
  onOpenEditApplication: (app: JobApplication) => void;
  onStatusChange: (id: number, status: Status) => void;
  onDelete: (id: number) => void;
  selectedApplication: JobApplication | null;
  setSelectedApplication: (application: JobApplication | null) => void;
  onExport: () => void;
  categoryOptions: string[];
  levelOptions: string[];
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [location, setLocation] = useState('All');
  const [mode, setMode] = useState('All');
  const [source, setSource] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [previewApplication, setPreviewApplication] = useState<JobApplication | null>(selectedApplication);

  const locations = useMemo(
    () => ['All', ...Array.from(new Set(applications.map((app) => app.location))).filter(Boolean)],
    [applications]
  );

  const filtered = useMemo(
    () =>
      applications.filter((app) => {
        const search = `${app.company} ${app.position} ${app.category} ${app.source} ${app.location}`.toLowerCase();

        return (
          search.includes(query.toLowerCase()) &&
          (status === 'All' || app.status === status) &&
          (category === 'All' || app.category === category) &&
          (level === 'All' || app.level === level) &&
          (location === 'All' || app.location === location) &&
          (mode === 'All' || app.workMode === mode) &&
          (source === 'All' || app.source === source)
        );
      }),
    [applications, query, status, category, level, location, mode, source]
  );

  useEffect(() => {
    if (previewApplication && !applications.some((app) => app.id === previewApplication.id)) {
      setPreviewApplication(null);
      setSelectedApplication(null);
    }
  }, [applications, previewApplication, setSelectedApplication]);

  const hasFilters =
    query ||
    status !== 'All' ||
    category !== 'All' ||
    level !== 'All' ||
    location !== 'All' ||
    mode !== 'All' ||
    source !== 'All';

  function openPreview(application: JobApplication) {
    setSelectedApplication(application);
    setPreviewApplication(application);
  }

  function clearFilters() {
    setQuery('');
    setStatus('All');
    setCategory('All');
    setLevel('All');
    setLocation('All');
    setMode('All');
    setSource('All');
  }

  return (
    <section className="page-section">
      <div className="toolbar">
        <div className="search-field wide">
          <Search size={18} />
          <input
            placeholder="Search company, position..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <CustomSelect label="Status" value={status} options={['All', ...statuses]} onChange={setStatus} />
        <CustomSelect label="Category" value={category} options={['All', ...categoryOptions]} onChange={setCategory} />
        <CustomSelect label="Level" value={level} options={['All', ...levelOptions]} onChange={setLevel} />
        <CustomSelect label="Location" value={location} options={locations} onChange={setLocation} />
        <CustomSelect label="Work mode" value={mode} options={['All', ...workModes]} onChange={setMode} />
        <CustomSelect label="Source" value={source} options={['All', ...sources]} onChange={setSource} />

        <div className="view-switch" aria-label="Applications view mode">
          <button
            className={viewMode === 'list' ? 'selected' : ''}
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon size={16} /> List
          </button>
          <button
            className={viewMode === 'table' ? 'selected' : ''}
            type="button"
            onClick={() => setViewMode('table')}
            aria-pressed={viewMode === 'table'}
          >
            <Table2 size={16} /> Table
          </button>
        </div>

        <button className="secondary-button" type="button" onClick={onExport}>
          <Download size={17} /> Export
        </button>

        {hasFilters ? (
          <button className="secondary-button" type="button" onClick={clearFilters}>
            Clear
          </button>
        ) : null}
      </div>

      {viewMode === 'list' ? (
        <DesktopApplicationsList
          applications={filtered}
          onSelect={openPreview}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onEdit={onOpenEditApplication}
        />
      ) : (
        <section className="panel-card applications-panel">
          <ApplicationsTable
            applications={filtered}
            onSelect={openPreview}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onEdit={onOpenEditApplication}
          />
        </section>
      )}

      {previewApplication ? (
        <ApplicationDetailsModal
          application={previewApplication}
          onClose={() => setPreviewApplication(null)}
          onEdit={() => {
            setPreviewApplication(null);
            onOpenEditApplication(previewApplication);
          }}
        />
      ) : null}
    </section>
  );
}


function DesktopApplicationsList({
  applications,
  onSelect,
  onStatusChange,
  onDelete,
  onEdit
}: {
  applications: JobApplication[];
  onSelect: (application: JobApplication) => void;
  onStatusChange: (id: number, status: Status) => void;
  onDelete: (id: number) => void;
  onEdit: (application: JobApplication) => void;
}) {
  return (
    <section className="desktop-applications-list" aria-label="Applications list">
      {applications.map((app) => (
        <article className="desktop-application-card" key={app.id} onClick={() => onSelect(app)}>
          <div className="desktop-application-main">
            <CompanyLogo name={app.company} domain={app.domain} large />
            <div className="desktop-application-copy">
              <div className="desktop-application-title-row">
                <div>
                  <h2>{app.position}</h2>
                  <p>{app.company}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="desktop-application-meta">
                <span><MapPin size={14} /> {app.location}</span>
                <span><Monitor size={14} /> {app.workMode}</span>
                <span><Tag size={14} /> {app.category}</span>
                <span><BriefcaseBusiness size={14} /> {app.level}</span>
              </div>
            </div>
          </div>

          <div className="desktop-application-side" onClick={(event) => event.stopPropagation()}>
            <div className="desktop-application-dates">
              <span>Applied <strong>{formatDate(app.dateApplied)}</strong></span>
              <span>Last contact <strong>{formatDate(app.lastContact)}</strong></span>
            </div>

            <div className="desktop-next-step">
              <span>Next step</span>
              <strong>{app.nextStep || 'Waiting'}</strong>
            </div>

            <div className="desktop-application-status">
              <CustomSelect
                value={app.status}
                options={statuses}
                onChange={(value) => onStatusChange(app.id, value as Status)}
              />
            </div>

            <div className="desktop-application-actions">
              <button
                className="ghost-icon"
                type="button"
                aria-label="Edit application"
                onClick={() => onEdit(app)}
              >
                <Pencil size={17} />
              </button>
              <button
                className="ghost-icon"
                type="button"
                aria-label="Open offer"
                onClick={() => app.offerUrl && window.open(app.offerUrl, '_blank')}
              >
                <ExternalLink size={17} />
              </button>
              <button
                className="ghost-icon danger"
                type="button"
                aria-label="Delete application"
                onClick={() => onDelete(app.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </article>
      ))}

      {!applications.length ? (
        <div className="empty-state panel-card">
          <Folder size={28} />
          <strong>No results</strong>
          <span>Try changing filters or add a new application.</span>
        </div>
      ) : null}
    </section>
  );
}

function ApplicationDetails({ application, onEdit }: { application: JobApplication; onEdit: () => void }) {
  return <div className="details-grid"><div><div className="details-heading"><CompanyLogo name={application.company} domain={application.domain} large /><div><h2>{application.company}</h2><p>{application.position}</p></div><StatusBadge status={application.status} /></div><div className="details-actions"><button className="secondary-button" type="button" onClick={() => application.offerUrl && window.open(application.offerUrl, '_blank')}><ExternalLink size={17} /> Open offer</button><button className="secondary-button" type="button" onClick={onEdit}><Pencil size={17} /> Edit</button></div></div><div className="details-lists"><InfoList title="Requirements" text={application.requirements} /><InfoList title="Benefits" text={application.benefits} /><InfoList title="Details" text={`${application.location}, ${application.workMode}, ${application.source}, ${application.cv}`} /></div><div className="timeline-card"><h3>Recruitment timeline</h3>{['Saved offer', 'CV sent', application.lastContact ? 'Company response' : 'Waiting', application.nextStep].map((item, index) => <div className="timeline-row" key={`${item}-${index}`}><span /><div><strong>{item}</strong><small>{index === 0 ? formatDate(application.dateApplied) : index === 1 ? formatDate(application.dateApplied) : index === 2 ? formatDate(application.lastContact) : 'Next step'}</small></div></div>)}</div></div>;
}


function ApplicationDetailsModal({
  application,
  onClose,
  onEdit
}: {
  application: JobApplication;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <BaseModal
      title="Application details"
      subtitle={`${application.company} Â· ${application.position}`}
      onClose={onClose}
    >
      <div className="application-details-modal custom-scroll">
        <ApplicationDetails application={application} onEdit={onEdit} />

        {application.notes ? (
          <section className="application-modal-note">
            <h3>Notes</h3>
            <p>{application.notes}</p>
          </section>
        ) : null}

        <footer className="modal-footer inner">
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>

          <button className="primary-button" type="button" onClick={onEdit}>
            <Pencil size={17} /> Edit application
          </button>
        </footer>
      </div>
    </BaseModal>
  );
}

function InfoList({ title, text }: { title: string; text: string }) {
  const items = text ? text.split(',').map((item) => item.trim()).filter(Boolean) : ['No data yet'];
  return <div className="info-list"><h3>{title}</h3><div>{items.map((item) => <span key={item}>{item}</span>)}</div></div>;
}

function CompaniesPage({ companies, applications, setCompanies, setToast }: { companies: Company[]; applications: JobApplication[]; setCompanies: (companies: Company[]) => void; setToast: (value: string) => void }) {
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('All');
  const [location, setLocation] = useState('All');
  const [modal, setModal] = useState<Company | null>(null);
  const locations = ['All', ...Array.from(new Set(companies.map((company) => company.location))).filter(Boolean)];
  const filtered = companies.filter((company) => `${company.name} ${company.industry} ${company.location}`.toLowerCase().includes(query.toLowerCase()) && (industry === 'All' || company.industry === industry) && (location === 'All' || company.location === location));
  function save(company: Company) {
    if (companies.some((item) => item.id === company.id)) setCompanies(companies.map((item) => item.id === company.id ? company : item));
    else setCompanies([company, ...companies]);
    setModal(null);
    setToast('Company saved.');
  }
  function remove(id: number) {
    setCompanies(companies.filter((company) => company.id !== id));
    setToast('Company removed.');
  }
  return <section className="page-section"><div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search companies..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><CustomSelect label="Industry" value={industry} options={['All', ...industries]} onChange={setIndustry} /><CustomSelect label="Location" value={location} options={locations} onChange={setLocation} /><button className="primary-button" type="button" onClick={() => setModal({ id: 0, name: '', domain: '', industry: 'Technology', location: 'Warsaw', website: '', contact: '', notes: '' })}><Plus size={17} /> Add company</button></div><div className="company-grid">{filtered.map((company) => { const stats = companyStats(company, applications); return <article className="company-card panel-card" key={company.id}><div className="company-card-top"><CompanyLogo name={company.name} domain={company.domain} large /><div><h2>{company.name}</h2><p>{company.industry}</p></div><div className="company-actions"><button className="ghost-icon" type="button" onClick={() => setModal(company)}><Pencil size={17} /></button><button className="ghost-icon danger" type="button" onClick={() => remove(company.id)}><Trash2 size={17} /></button></div></div><div className="company-meta"><span><MapPin size={15} /> {company.location}</span><span><Globe size={15} /> {company.website.replace(/^https?:\/\//, '')}</span></div><p className="company-note">{company.notes || 'No notes yet.'}</p><div className="company-stats"><div><strong>{stats.count}</strong><span>applications</span></div><div><strong>{stats.responseRate}%</strong><span>response</span></div></div><div className="company-footer"><StatusBadge status={stats.lastStatus as Status} /><span>{formatDate(stats.lastDate)}</span></div></article>; })}</div>{modal ? <CompanyModal company={modal} onClose={() => setModal(null)} onSave={save} /> : null}</section>;
}

function CompanyModal({ company, onClose, onSave }: { company: Company; onClose: () => void; onSave: (company: Company) => void }) {
  const [form, setForm] = useState(company);
  function set<K extends keyof Company>(key: K, value: Company[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(event: FormEvent) { event.preventDefault(); onSave({ ...form, id: form.id || makeId(), domain: safeDomain(form.name, form.domain), website: form.website || `https://${safeDomain(form.name, form.domain)}` }); }
  return <BaseModal title={form.id ? 'Edit company' : 'Add company'} subtitle="Save company details for recruitment history." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid"><TextField label="Company name" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Sii" /><TextField label="Domain" value={form.domain} onChange={(v) => set('domain', v)} placeholder="e.g. sii.pl" /><div className="form-field"><span>Industry</span><CustomSelect value={form.industry} options={industries} onChange={(v) => set('industry', v)} /></div><TextField label="Location" value={form.location} onChange={(v) => set('location', v)} /><TextField label="Website" value={form.website} onChange={(v) => set('website', v)} /><TextField label="Contact" value={form.contact} onChange={(v) => set('contact', v)} /></div><TextAreaField label="Notes" value={form.notes} onChange={(v) => set('notes', v)} /><ModalFooter onClose={onClose} submitLabel="Save company" /></form></BaseModal>;
}

function StatisticsPage({ applications, categoryOptions }: { applications: JobApplication[]; categoryOptions: string[] }) {
  const [range, setRange] = useState('All time');
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState('All');
  const scoped = applications.filter((app) => (category === 'All' || app.category === category) && (mode === 'All' || app.workMode === mode));
  const stats = calculateStats(scoped);
  return <section className="page-section"><div className="toolbar compact-toolbar"><CustomSelect label="Range" value={range} options={['Last 7 days', 'Last 30 days', 'This month', 'All time']} onChange={setRange} /><CustomSelect label="Category" value={category} options={['All', ...categoryOptions]} onChange={setCategory} /><CustomSelect label="Work mode" value={mode} options={['All', ...workModes]} onChange={setMode} /></div><div className="stats-metrics-grid"><MetricCard label="Total applications" value={stats.total} hint={range} /><MetricCard label="Active processes" value={stats.active} hint="currently open" /><MetricCard label="Response rate" value={`${stats.responseRate}%`} hint="from selected" tone="green-text" /><MetricCard label="Interview rate" value={`${stats.successRate}%`} hint="positive stages" tone="blue-text" /><MetricCard label="Ghosted" value={scoped.filter((app) => app.status === 'Ghosted').length} hint="to archive" /><MetricCard label="Avg response time" value="6d" hint="mock metric" /></div><div className="stats-grid"><section className="panel-card chart-panel wide-chart"><div className="mini-title"><BarChart3 size={18} /><h2>Applications by category</h2></div><BarList rows={topRows(scoped.map((app) => app.category))} /></section><ApplicationSummary applications={scoped} /><section className="panel-card chart-panel"><div className="mini-title"><Sparkles size={18} /><h2>Applications by level</h2></div><BarList rows={topRows(scoped.map((app) => app.level))} /></section><MiniListCard icon={Globe} title="Best sources" rows={topRows(scoped.map((app) => app.source))} /></div></section>;
}

function BarList({ rows }: { rows: [string, string][] }) {
  const max = Math.max(...rows.map(([, value]) => Number(value)), 1);
  return <div className="bar-chart-list">{rows.map(([label, value]) => <div className="bar-row" key={label}><span>{label}</span><div><span style={{ width: `${(Number(value) / max) * 100}%` }} /></div><strong>{value}</strong></div>)}</div>;
}

function CalendarPage({ events, applications, setEvents, setToast }: { events: CalendarEvent[]; applications: JobApplication[]; setEvents: (events: CalendarEvent[]) => void; setToast: (value: string) => void }) {
  const [view, setView] = useState<CalendarView>('Month');
  const [modal, setModal] = useState<CalendarEvent | null>(null);
  const sorted = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  const [monthDate, setMonthDate] = useState(() => startOfMonth(today()));
  const monthCells = getMonthCells(monthDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  function save(event: CalendarEvent) {
    if (events.some((item) => item.id === event.id)) setEvents(events.map((item) => item.id === event.id ? event : item));
    else setEvents([event, ...events]);
    setModal(null);
    setToast('Calendar event saved.');
  }
  function remove(id: number) { setEvents(events.filter((event) => event.id !== id)); setToast('Calendar event removed.'); }
  function newEvent(date = today(), time = '10:00') {
    setModal({ id: 0, title: '', company: applications[0]?.company || '', applicationId: applications[0]?.id, date, time, type: 'HR interview', location: 'Online', meetingLink: '', notes: '' });
  }
  return (
    <section className="page-section">
      <div className="toolbar compact-toolbar">
        <div className="segmented-inline">{(['Month', 'Week', 'List'] as CalendarView[]).map((item) => <button type="button" className={view === item ? 'selected' : ''} key={item} onClick={() => setView(item)}>{item}</button>)}</div>
        <button className="primary-button" type="button" onClick={() => newEvent()}><Plus size={17} /> Add event</button>
      </div>
      <div className="calendar-layout">
        {view === 'Month' ? (
          <section className="panel-card calendar-card">
            <div className="calendar-header-row">
              <div><h2>{formatMonthYear(monthDate)}</h2><p>Monthly overview</p></div>
              <div className="calendar-nav-controls">
                <button className="ghost-icon calendar-nav-button" type="button" onClick={() => setMonthDate(addMonths(monthDate, -1))} aria-label="Previous month">â€ą</button>
                <button className="secondary-button today-button" type="button" onClick={() => setMonthDate(startOfMonth(today()))}>Today</button>
                <button className="ghost-icon calendar-nav-button" type="button" onClick={() => setMonthDate(addMonths(monthDate, 1))} aria-label="Next month">â€ş</button>
              </div>
            </div>
            <div className="calendar-grid-head">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid-days">{monthCells.map((cell) => { const dayEvents = sorted.filter((event) => event.date === cell.iso); return <button className={`calendar-day ${dayEvents.length ? 'has-event' : ''} ${!cell.isCurrentMonth ? 'muted-day' : ''}`} type="button" key={cell.iso} onClick={() => dayEvents[0] ? setModal(dayEvents[0]) : newEvent(cell.iso)}><span>{cell.day}</span>{dayEvents.slice(0, 2).map((event) => <small key={event.id}>{event.title}</small>)}</button>; })}</div>
          </section>
        ) : view === 'Week' ? (
          <section className="panel-card calendar-card week-calendar">
            <div className="calendar-header-row">
              <div><h2>Week view</h2><p>{formatWeekRange(weekStart)}</p></div>
              <div className="calendar-nav-controls"><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">â€ą</button><button className="secondary-button today-button" type="button" onClick={() => setWeekStart(startOfWeek(today()))}>Today</button><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">â€ş</button></div>
            </div>
            <div className="week-grid custom-scroll">
              {weekDays.map((day) => {
                const iso = toIsoDate(day);
                const dayEvents = sorted.filter((event) => event.date === iso);
                return (
                  <div className="week-day-column" key={iso}>
                    <button className="week-day-header" type="button" onClick={() => newEvent(iso)}>
                      <span>{formatWeekday(day)}</span>
                      <strong>{day.getDate()}</strong>
                    </button>
                    <div className="week-events">
                      {dayEvents.map((event) => <button className="week-event-block" key={event.id} type="button" onClick={() => setModal(event)}><span>{event.time}</span><strong>{event.title}</strong><small>{event.company}</small></button>)}
                      {!dayEvents.length ? <button className="week-empty-slot" type="button" onClick={() => newEvent(iso)}>Add event</button> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="panel-card calendar-card list-calendar">
            <h2>All events</h2>
            {sorted.map((event) => <EventCard key={event.id} event={event} onEdit={() => setModal(event)} onDelete={() => remove(event.id)} />)}
          </section>
        )}
        <section className="panel-card event-panel"><div className="mini-title"><CalendarDays size={18} /><h2>Upcoming events</h2></div>{sorted.slice(0, 5).map((event) => <EventCard key={event.id} event={event} compact onEdit={() => setModal(event)} onDelete={() => remove(event.id)} />)}</section>
      </div>
      {modal ? <EventModal event={modal} applications={applications} onClose={() => setModal(null)} onSave={save} /> : null}
    </section>
  );
}

function EventCard({ event, onEdit, onDelete, compact = false }: { event: CalendarEvent; onEdit: () => void; onDelete: () => void; compact?: boolean }) {
  return <div className={`event-card ${compact ? 'compact-event' : ''}`}><span className="event-icon"><Clock size={16} /></span><div><strong>{event.title}</strong><p>{event.company}</p><small>{formatDate(event.date)}, {event.time} Â· {event.location}</small></div><div className="event-card-actions"><button className="ghost-icon" type="button" onClick={onEdit}><Pencil size={16} /></button><button className="ghost-icon danger" type="button" onClick={onDelete}><Trash2 size={16} /></button></div>{event.type.includes('interview') ? <Video size={16} /> : <Mail size={16} />}</div>;
}

function EventModal({ event, applications, onClose, onSave }: { event: CalendarEvent; applications: JobApplication[]; onClose: () => void; onSave: (event: CalendarEvent) => void }) {
  const [form, setForm] = useState(event);
  function set<K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(e: FormEvent) { e.preventDefault(); onSave({ ...form, id: form.id || makeId() }); }
  return <BaseModal title={form.id ? 'Edit event' : 'Add event'} subtitle="Plan interviews, follow-ups and recruitment tasks." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid"><TextField label="Event title" value={form.title} onChange={(v) => set('title', v)} placeholder="e.g. HR interview" /><div className="form-field"><span>Company</span><CustomSelect value={form.company || 'General'} options={['General', ...Array.from(new Set(applications.map((app) => app.company)))]} onChange={(v) => set('company', v)} /></div><div className="form-field"><span>Type</span><CustomSelect value={form.type} options={eventTypes} onChange={(v) => set('type', v)} /></div><TextField label="Date" type="date" value={form.date} onChange={(v) => set('date', v)} /><TextField label="Time" type="time" value={form.time} onChange={(v) => set('time', v)} /><TextField label="Location" value={form.location} onChange={(v) => set('location', v)} /><TextField label="Meeting link" value={form.meetingLink} onChange={(v) => set('meetingLink', v)} /></div><TextAreaField label="Notes" value={form.notes} onChange={(v) => set('notes', v)} /><ModalFooter onClose={onClose} submitLabel="Save event" /></form></BaseModal>;
}

function DocumentsPage({ documents, setDocuments, onExport, setToast }: { documents: DocumentItem[]; setDocuments: (docs: DocumentItem[]) => void; onExport: () => void; setToast: (value: string) => void }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [linkModal, setLinkModal] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const filtered = documents.filter((doc) => `${doc.name} ${doc.type} ${doc.category}`.toLowerCase().includes(query.toLowerCase()) && (type === 'All' || doc.type === type));
  function upload(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    const next: DocumentItem = { id: makeId(), name: file.name, type: file.name.toLowerCase().includes('cv') ? 'CV' : 'Other', category: 'General', updated: today(), usedIn: 0, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, url: '' };
    setDocuments([next, ...documents]);
    setToast('Document added to demo.');
  }
  function addLink(doc: DocumentItem) { setDocuments([doc, ...documents]); setLinkModal(false); setToast('Link saved.'); }
  function remove(id: number) { setDocuments(documents.filter((doc) => doc.id !== id)); setToast('Document removed.'); }
  return <section className="page-section"><div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search documents..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><CustomSelect label="Type" value={type} options={['All', ...documentTypes]} onChange={setType} /><button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}><Upload size={17} /> Upload</button><input ref={fileInput} type="file" hidden onChange={(e) => upload(e.target.files)} /><button className="secondary-button" type="button" onClick={() => setLinkModal(true)}><LinkIcon size={17} /> Add link</button><button className="secondary-button" type="button" onClick={onExport}><Download size={17} /> Export CSV</button></div><div className="document-grid">{filtered.map((doc) => <article className="panel-card document-card" key={doc.id}><div className="document-icon"><FileText size={24} /></div><div><h2>{doc.name}</h2><p>{doc.type} Â· {doc.category}</p></div><div className="document-meta"><span>Updated {formatDate(doc.updated)}</span><span>Used in {doc.usedIn} applications</span><span>{doc.size}</span></div><div className="document-actions"><button className="ghost-icon" type="button" onClick={() => doc.url && window.open(doc.url, '_blank')}><Eye size={17} /></button><button className="ghost-icon" type="button" onClick={() => setToast('Preview/download is mocked for local files.')}><Download size={17} /></button><button className="ghost-icon danger" type="button" onClick={() => remove(doc.id)}><Trash2 size={17} /></button></div></article>)}</div><section className="panel-card insight-strip"><Sparkles size={18} /><span>Most used CV: <strong>CV_NET_Intern_2026.pdf</strong></span><span>Best response rate: <strong>CV_Cybersecurity_IAM_2026.pdf</strong></span></section>{linkModal ? <DocumentLinkModal onClose={() => setLinkModal(false)} onSave={addLink} /> : null}</section>;
}

function AIToolsPage({ documents, settings, setToast, onOpenSettings, onAddApplicationFromScout }: { documents: DocumentItem[]; settings: AppSettings; setToast: (value: string) => void; onOpenSettings: (tab?: ProfileTab) => void; onAddApplicationFromScout: (match: JobScoutMatch) => void }) {
  const cvDocuments = documents.filter((document) => document.type === 'CV');
  const cvOptions = cvDocuments.map((document) => document.name);
  const [activeTool, setActiveTool] = useState<AiTool>('scout');
  const [reviewReady, setReviewReady] = useState(true);
  const [coverLetter, setCoverLetter] = useState('Dear Hiring Team,\n\nI am excited to apply for the Junior .NET Developer Intern role. My background in C#, SQL, REST APIs and security-aware documentation matches the requirements of the position.\n\nKind regards,\nDemo User');
  const [scoutTab, setScoutTab] = useState<JobScoutTab>('new');
  const [scoutMatches, setScoutMatches] = useState<JobScoutMatch[]>(initialJobScoutMatches);
  const [scoutRuns, setScoutRuns] = useState<JobScoutRun[]>(initialJobScoutRuns);
  const [scoutMinScore, setScoutMinScore] = useState(70);
  const [scoutFrequency, setScoutFrequency] = useState<JobScoutFrequency>('Daily');
  const [scoutUseCvContext, setScoutUseCvContext] = useState(false);
  const newMatches = scoutMatches.filter((match) => match.status === 'new');
  const lastRun = scoutRuns[0];
  const preferenceSummary = {
    roles: uniqueOptions(settings.preferences.categories, settings.preferences.levels).slice(0, 6),
    locations: settings.preferences.locationPreferences.length ? settings.preferences.locationPreferences.map((location) => `${location.city} +${location.radiusKm} km`).join(', ') : 'No city radius preferences',
    workModes: settings.preferences.workModes.includes(allWorkModes) ? allWorkModes : settings.preferences.workModes.join(', ')
  };

  function runReview(event: FormEvent) {
    event.preventDefault();
    setReviewReady(true);
    setToast('Demo CV review refreshed.');
  }

  function generateCoverLetter(event: FormEvent) {
    event.preventDefault();
    setCoverLetter('Dear Hiring Team,\n\nI am writing to express my interest in the selected role. This demo draft uses your profile details, CV version and job preferences to show the intended AI cover letter flow.\n\nThe production version renders the final result as a LaTeX PDF with preview and download controls.\n\nKind regards,\nDemo User');
    setToast('Demo cover letter generated.');
  }

  function runJobScout() {
    const now = new Date().toISOString();
    setScoutMatches((current) => {
      const byId = new Map(current.map((match) => [match.id, match]));
      return initialJobScoutMatches.map((match) => byId.get(match.id) ?? match);
    });
    const demoRun: JobScoutRun = {
      id: `scout-run-${Date.now()}`,
      startedAt: now,
      completedAt: now,
      status: 'completed',
      newMatches: initialJobScoutMatches.filter((match) => match.status === 'new').length,
      message: 'Demo search checked mock RSS/API sources, deduplicated repeated offers and refreshed current matches.'
    };
    setScoutRuns((current) => [demoRun, ...current].slice(0, 8));
    setScoutTab('new');
    setToast('AI Job Scout demo search completed.');
  }

  function updateScoutMatchStatus(id: string, status: JobScoutMatchStatus) {
    setScoutMatches((current) => current.map((match) => match.id === id ? { ...match, status } : match));
    setScoutTab(status === 'new' ? 'new' : status);
    setToast(status === 'saved' ? 'Job match saved.' : status === 'ignored' ? 'Job match ignored.' : 'Job match updated.');
  }

  function addScoutMatch(match: JobScoutMatch) {
    onAddApplicationFromScout(match);
    setScoutMatches((current) => current.map((item) => item.id === match.id ? { ...item, status: 'added' } : item));
    setScoutTab('added');
  }

  return (
    <section className="page-section ai-tools-page">
      <div className="ai-privacy-note panel-card"><Sparkles size={20} /><div><strong>Demo AI privacy notice</strong><p>This public mockup uses sample data only. No real CV or job description is sent anywhere.</p></div></div>
      <div className="ai-tool-grid">
        <button className={`ai-tool-card panel-card ${activeTool === 'review' ? 'active' : ''}`} type="button" onClick={() => setActiveTool('review')}><span><FileText size={22} /></span><div><h2>AI CV Review</h2><p>Analyze your CV, identify strengths and weaknesses, check ATS compatibility and compare it with a job offer.</p></div><strong>Review CV</strong></button>
        <button className={`ai-tool-card panel-card ${activeTool === 'cover' ? 'active' : ''}`} type="button" onClick={() => setActiveTool('cover')}><span><Edit3 size={22} /></span><div><h2>AI Cover Letter Generator</h2><p>Generate a personalized cover letter based on your CV and a selected job offer.</p></div><strong>Generate cover letter</strong></button>
        <article className={`ai-tool-card ai-tool-card-actions-card panel-card ${activeTool === 'scout' ? 'active' : ''}`}><span><BriefcaseBusiness size={22} /></span><div><h2>AI Job Scout</h2><p>Find new job opportunities matching your experience, skills and career preferences.</p><div className="ai-tool-card-meta"><small>{newMatches.length} new matches</small><small>Last search: {lastRun ? formatDate(lastRun.completedAt.slice(0, 10)) : 'Never'}</small><small>Next search: {scoutFrequency}</small></div></div><div className="ai-tool-card-actions"><button className="secondary-button small" type="button" onClick={() => { setActiveTool('scout'); setScoutTab('new'); }}>View matches</button><button className="primary-button small" type="button" onClick={() => { setActiveTool('scout'); runJobScout(); }}>Search now</button><button className="secondary-button small" type="button" onClick={() => onOpenSettings('preferences')}>Configure preferences</button></div></article>
      </div>
      <div className="ai-workspace-grid">
        <section className="panel-card ai-form-panel">
          {activeTool === 'review' ? <form className="modal-form compact-ai-form" onSubmit={runReview}><div className="mini-title"><FileText size={18} /><h2>AI CV Review</h2></div><div className="form-grid"><div className="form-field"><span>CV document</span><CustomSelect value={cvOptions[0] || 'No CV selected'} options={cvOptions.length ? cvOptions : ['No CV selected']} onChange={() => undefined} /></div><div className="form-field"><span>Analysis type</span><CustomSelect value="job-match" options={['general', 'job-match']} onChange={() => undefined} /></div><div className="form-field"><span>Report language</span><CustomSelect value="en" options={['en', 'pl']} onChange={() => undefined} /></div><TextField label="Job title" value="Junior .NET Developer Intern" onChange={() => undefined} /></div><TextAreaField label="Job description" value="Demo role requiring C#, .NET, SQL, Git and REST API basics." onChange={() => undefined} /><button className="primary-button ai-form-action" type="submit">Run review</button></form> : activeTool === 'cover' ? <form className="modal-form compact-ai-form" onSubmit={generateCoverLetter}><div className="mini-title"><Edit3 size={18} /><h2>AI Cover Letter Generator</h2></div><div className="form-grid"><div className="form-field"><span>CV document</span><CustomSelect value={cvOptions[0] || 'No CV selected'} options={cvOptions.length ? cvOptions : ['No CV selected']} onChange={() => undefined} /></div><TextField label="Company name" value="Campgemini Demo" onChange={() => undefined} /><TextField label="Job title" value="Junior .NET Developer Intern" onChange={() => undefined} /><div className="form-field"><span>Language</span><CustomSelect value="en" options={['en', 'pl']} onChange={() => undefined} /></div></div><div className="cover-profile-card"><div className="cover-profile-main"><span><User size={14} /> Profile context</span><strong>Demo User</strong><small>LinkedIn, GitHub and portfolio are configured in Profile settings.</small></div><button className="secondary-button small" type="button" onClick={() => onOpenSettings('profile')}>Edit profile</button></div><TextAreaField label="Job description" value="Demo job description for a .NET internship." onChange={() => undefined} /><button className="primary-button" type="submit">Generate</button></form> : <form className="modal-form compact-ai-form job-scout-form" onSubmit={(event) => { event.preventDefault(); runJobScout(); }}><div className="mini-title"><BriefcaseBusiness size={18} /><h2>AI Job Scout</h2></div><p className="ai-helper-text">Cyclically checks connected mock job sources, deduplicates offers and uses AI-style scoring to explain fit.</p><div className="job-source-notice ready"><Sparkles size={18} /><div><strong>4 demo source providers active</strong><span>Company careers RSS, Just Join IT API, No Fluff Jobs feed, manual company list.</span></div></div><div className="job-scout-summary-grid"><div><span>Roles</span><strong>{preferenceSummary.roles.join(', ') || 'No roles selected'}</strong></div><div><span>Locations</span><strong>{preferenceSummary.locations}</strong></div><div><span>Work modes</span><strong>{preferenceSummary.workModes}</strong></div></div><div className="form-grid"><NumberStepper label="Notify above match score" value={scoutMinScore} onChange={setScoutMinScore} min={0} max={100} unit="%" /><div className="form-field"><span>Search schedule</span><CustomSelect value={scoutFrequency} options={['Manual', 'Daily', 'Weekdays', 'Weekly']} onChange={(value) => setScoutFrequency(value as JobScoutFrequency)} /></div></div><div className="job-scout-consent"><div><strong>Use full CV context</strong><span>Off by default. Demo can score from profile preferences only until enabled.</span></div><button className={`toggle ${scoutUseCvContext ? 'on' : ''}`} type="button" aria-pressed={scoutUseCvContext} onClick={() => setScoutUseCvContext(!scoutUseCvContext)}><span /></button></div><div className="job-scout-actions"><button className="primary-button" type="submit">Search now</button><button className="secondary-button" type="button" onClick={() => onOpenSettings('preferences')}><SlidersHorizontal size={16} /> Configure preferences</button></div></form>}
        </section>
        <section className="panel-card ai-result-panel">{activeTool === 'review' ? <MockCvReviewReport ready={reviewReady} /> : activeTool === 'cover' ? <MockCoverLetterEditor value={coverLetter} onChange={setCoverLetter} setToast={setToast} /> : <JobScoutPanel activeTab={scoutTab} matches={scoutMatches} runs={scoutRuns} minScore={scoutMinScore} onTabChange={setScoutTab} onSave={(match) => updateScoutMatchStatus(match.id, 'saved')} onIgnore={(match) => updateScoutMatchStatus(match.id, 'ignored')} onAdd={addScoutMatch} onSearch={runJobScout} onOpenPreferences={() => onOpenSettings('preferences')} />}</section>
      </div>
    </section>
  );
}

function MockCvReviewReport({ ready }: { ready: boolean }) {
  if (!ready) return <div className="ai-result-empty"><Sparkles size={28} /><strong>No report selected</strong><span>Run a CV review to see a demo report.</span></div>;
  return <div className="cv-review-report"><div className="ai-report-header"><div><h2>CV_NET_Intern_Demo.pdf</h2><p>Job match review - demo report</p></div><span className="priority priority-high">Mock</span></div><div className="ai-score-hero"><strong>84</strong><span>Overall match score</span><p>Strong internship-level fit for .NET, SQL and REST API requirements. Add a short cloud/Azure project note to improve the match.</p></div><div className="ai-report-grid"><div><h3>Strengths</h3><span className="ai-tag positive">C# basics</span><span className="ai-tag positive">SQL</span><span className="ai-tag positive">Git</span></div><div><h3>Gaps</h3><span className="ai-tag warning">Azure basics</span><span className="ai-tag warning">Testing examples</span></div></div></div>;
}

function MockCoverLetterEditor({ value, onChange, setToast }: { value: string; onChange: (value: string) => void; setToast: (value: string) => void }) {
  return <div className="cover-letter-editor"><div className="ai-report-header"><div><h2>Cover letter draft</h2><p>Editable demo output with PDF actions mocked.</p></div><button className="secondary-button small" type="button" onClick={() => setToast('Demo PDF preview is mocked in GitHub Pages.')}>Preview PDF</button></div><textarea value={value} onChange={(event) => onChange(event.target.value)} /><div className="cover-letter-file-row"><label className="cover-letter-file-name"><span>PDF file name</span><input value="Campgemini_Demo_cover_letter" readOnly /></label><button className="primary-button cover-letter-download-button" type="button" onClick={() => setToast('Demo download action shown.')}>Download PDF</button></div></div>;
}

function JobScoutPanel({ activeTab, matches, runs, minScore, onTabChange, onSave, onIgnore, onAdd, onSearch, onOpenPreferences }: { activeTab: JobScoutTab; matches: JobScoutMatch[]; runs: JobScoutRun[]; minScore: number; onTabChange: (tab: JobScoutTab) => void; onSave: (match: JobScoutMatch) => void; onIgnore: (match: JobScoutMatch) => void; onAdd: (match: JobScoutMatch) => void; onSearch: () => void; onOpenPreferences: () => void }) {
  const counts: Record<JobScoutTab, number> = { new: matches.filter((match) => match.status === 'new').length, saved: matches.filter((match) => match.status === 'saved').length, ignored: matches.filter((match) => match.status === 'ignored').length, added: matches.filter((match) => match.status === 'added').length, history: runs.length };
  const visibleMatches = activeTab === 'history' ? [] : matches.filter((match) => match.status === activeTab);
  return <div className="job-scout-panel"><div className="ai-report-header"><div><h2>AI Job Scout</h2><p>Demo of real-source discovery, AI scoring and application handoff.</p></div><button className="secondary-button small" type="button" onClick={onOpenPreferences}><SlidersHorizontal size={15} /> Preferences</button></div><div className="job-scout-tabs" role="tablist" aria-label="AI Job Scout views">{jobScoutTabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} type="button" onClick={() => onTabChange(tab.id)}>{tab.label}<span>{counts[tab.id]}</span></button>)}</div>{activeTab === 'history' ? <div className="job-scout-run-list">{runs.map((run) => <article key={run.id} className={`job-scout-run ${run.status}`}><div><strong>{run.status === 'completed' ? 'Search completed' : 'Search blocked'}</strong><span>{formatDateTime(run.completedAt)}</span><p>{run.message}</p></div><em>{run.newMatches} new matches</em></article>)}</div> : visibleMatches.length ? <div className="job-scout-list">{visibleMatches.map((match) => <JobScoutMatchCard key={match.id} match={match} onSave={onSave} onIgnore={onIgnore} onAdd={onAdd} />)}</div> : <div className="job-scout-empty"><Search size={28} /><strong>No matches in this tab</strong><span>Run a demo search to refresh jobs scoring at least {minScore}%.</span><div className="job-scout-empty-actions"><button className="primary-button" type="button" onClick={onSearch}>Search now</button><button className="secondary-button" type="button" onClick={onOpenPreferences}>Configure preferences</button></div></div>}</div>;
}

function JobScoutMatchCard({ match, onSave, onIgnore, onAdd }: { match: JobScoutMatch; onSave: (match: JobScoutMatch) => void; onIgnore: (match: JobScoutMatch) => void; onAdd: (match: JobScoutMatch) => void }) {
  return <article className="job-scout-card"><header><div><small>{match.source} - Found {formatDate(match.foundAt)} - Published {formatDate(match.publishedAt)}</small><h3>{match.title}</h3><p><Building2 size={15} /> {match.company} <MapPin size={15} /> {match.location} <Monitor size={15} /> {match.workMode}</p></div><strong>{match.matchScore}%</strong></header><p>{match.matchReason}</p><div className="job-scout-skill-grid"><div><span>Matched tech</span><div>{match.matchedSkills.map((skill) => <em key={skill}>{skill}</em>)}</div></div><div><span>Gaps</span><div>{match.gaps.map((gap) => <em key={gap}>{gap}</em>)}</div></div></div><div className="job-scout-card-actions"><button className="primary-button small" type="button" onClick={() => window.open(match.applyUrl, '_blank')}><ExternalLink size={15} /> Apply</button><button className="secondary-button small" type="button" onClick={() => onSave(match)} disabled={match.status === 'saved'}><Pin size={15} /> Save</button><button className="secondary-button small" type="button" onClick={() => onIgnore(match)} disabled={match.status === 'ignored'}><X size={15} /> Ignore</button><button className="secondary-button small" type="button" onClick={() => onAdd(match)} disabled={match.status === 'added'}><BriefcaseBusiness size={15} /> Add to applications</button></div></article>;
}

function DocumentLinkModal({ onClose, onSave }: { onClose: () => void; onSave: (doc: DocumentItem) => void }) {
  const [name, setName] = useState('Portfolio link');
  const [url, setUrl] = useState('https://');
  const [type, setType] = useState<DocKind>('Portfolio');
  function submit(e: FormEvent) { e.preventDefault(); onSave({ id: makeId(), name, type, category: 'General', updated: today(), usedIn: 0, size: 'URL', url }); }
  return <BaseModal title="Add link" subtitle="Save portfolio, GitHub, LinkedIn or another resource." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid"><TextField label="Name" value={name} onChange={setName} /><TextField label="URL" value={url} onChange={setUrl} /><div className="form-field"><span>Type</span><CustomSelect value={type} options={documentTypes} onChange={(v) => setType(v as DocKind)} /></div></div><ModalFooter onClose={onClose} submitLabel="Save link" /></form></BaseModal>;
}

function NotesPage({ notes, setNotes, setToast }: { notes: NoteItem[]; setNotes: (notes: NoteItem[]) => void; setToast: (value: string) => void }) {
  const [selectedId, setSelectedId] = useState(notes[0]?.id || 0);
  const selected = notes.find((note) => note.id === selectedId) || notes[0];
  function patchNote(patch: Partial<NoteItem>) { if (!selected) return; setNotes(notes.map((note) => note.id === selected.id ? { ...note, ...patch, updated: today() } : note)); }
  function addNote() { const note: NoteItem = { id: makeId(), title: 'New recruitment note', company: 'General', application: 'General', tag: 'Application notes', updated: today(), body: 'Start writing here.', checklist: [{ id: makeId(), text: 'First checklist item', done: false }] }; setNotes([note, ...notes]); setSelectedId(note.id); setToast('Note added.'); }
  function deleteNote(id: number) { const next = notes.filter((note) => note.id !== id); setNotes(next); setSelectedId(next[0]?.id || 0); setToast('Note deleted.'); }
  function addChecklistItem() { if (!selected) return; patchNote({ checklist: [...selected.checklist, { id: makeId(), text: 'New checklist item', done: false }] }); }
  function updateChecklist(id: number, patch: Partial<ChecklistItem>) { if (!selected) return; patchNote({ checklist: selected.checklist.map((item) => item.id === id ? { ...item, ...patch } : item) }); }
  function deleteChecklist(id: number) { if (!selected) return; patchNote({ checklist: selected.checklist.filter((item) => item.id !== id) }); }
  return <section className="page-section"><div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search notes..." /></div><button className="primary-button" type="button" onClick={addNote}><Plus size={17} /> Add note</button></div><div className="notes-layout"><aside className="notes-list panel-card custom-scroll">{notes.map((note) => <button key={note.id} className={`note-card ${selected?.id === note.id ? 'selected' : ''}`} type="button" onClick={() => setSelectedId(note.id)}><strong>{note.title}</strong><span>{note.company} Â· {note.tag}</span><small>{formatDate(note.updated)}</small></button>)}</aside>{selected ? <section className="panel-card note-editor"><div className="note-editor-head"><TextField label="Title" value={selected.title} onChange={(v) => patchNote({ title: v })} /><button className="ghost-icon danger" type="button" onClick={() => deleteNote(selected.id)}><Trash2 size={18} /></button></div><div className="form-grid"><TextField label="Company" value={selected.company} onChange={(v) => patchNote({ company: v })} /><TextField label="Application" value={selected.application} onChange={(v) => patchNote({ application: v })} /><TextField label="Tag" value={selected.tag} onChange={(v) => patchNote({ tag: v })} /></div><label className="form-field full-field"><span>Note body</span><textarea value={selected.body} onChange={(event) => patchNote({ body: event.target.value })} /></label><div className="checklist-panel"><div className="checklist-header"><h3>Checklist</h3><button className="secondary-button small" type="button" onClick={addChecklistItem}><Plus size={15} /> Add item</button></div>{selected.checklist.map((item) => <div className="checklist-row" key={item.id}><button className={`check-box ${item.done ? 'checked' : ''}`} type="button" onClick={() => updateChecklist(item.id, { done: !item.done })}>{item.done ? <Check size={14} /> : null}</button><input value={item.text} onChange={(event) => updateChecklist(item.id, { text: event.target.value })} /><button className="ghost-icon danger" type="button" onClick={() => deleteChecklist(item.id)}><Trash2 size={15} /></button></div>)}</div><div className="note-save-hint"><CheckCircle2 size={16} /> Changes are saved automatically in this mockup.</div></section> : <section className="panel-card empty-state"><StickyNote size={28} /><strong>No note selected</strong><span>Add a note to start writing.</span></section>}</div></section>;
}

function BaseModal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop"><section className="add-modal" role="dialog" aria-modal="true"><header className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="close-button" type="button" onClick={onClose}><X size={20} /></button></header>{children}</section></div>;
}

function ModalFooter({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return <footer className="modal-footer inner"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><CheckCircle2 size={17} /> {submitLabel}</button></footer>;
}

function ApplicationModal({ application, companies, documents, categoryOptions, levelOptions, onClose, onSave }: { application?: JobApplication; companies: Company[]; documents: DocumentItem[]; categoryOptions: string[]; levelOptions: string[]; onClose: () => void; onSave: (app: JobApplication) => void }) {
  const [form, setForm] = useState<Omit<JobApplication, 'id'>>(() => application ? { ...application } : { company: companies[0]?.name || '', companyId: companies[0]?.id, domain: companies[0]?.domain || '', position: '', category: '.NET', level: 'Internship', status: 'Applied', dateApplied: today(), lastContact: '', nextStep: 'Waiting', location: 'Remote', workMode: 'Hybrid', source: 'LinkedIn', offerUrl: '', requirements: '', benefits: '', notes: '', cv: documents.find((doc) => doc.type === 'CV')?.name || 'CV_NET_Intern_Demo.pdf' });
  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function chooseCompany(name: string) { const company = companies.find((item) => item.name === name); setForm((current) => ({ ...current, company: name, companyId: company?.id, domain: company?.domain || safeDomain(name), offerUrl: current.offerUrl || company?.website || '' })); }
  function submit(event: FormEvent) { event.preventDefault(); onSave({ ...form, id: application?.id || makeId(), domain: safeDomain(form.company, form.domain) }); }
  return <BaseModal title={application ? 'Edit application' : 'Add application'} subtitle="Create or update a recruitment entry." onClose={onClose}><form className="add-form custom-scroll" onSubmit={submit}><div className="form-grid"><div className="form-field"><span>Saved company</span><CustomSelect value={companies.some((c) => c.name === form.company) ? form.company : 'Custom company'} options={[...companies.map((c) => c.name), 'Custom company']} onChange={(v) => v === 'Custom company' ? set('company', '') : chooseCompany(v)} /></div><TextField label="Company name" value={form.company} onChange={(v) => set('company', v)} placeholder="e.g. Sii" /><TextField label="Company domain" value={form.domain} onChange={(v) => set('domain', v)} placeholder="e.g. sii.pl" /><TextField label="Position" value={form.position} onChange={(v) => set('position', v)} placeholder="e.g. .NET Intern" /><TextField label="Offer URL" value={form.offerUrl} onChange={(v) => set('offerUrl', v)} placeholder="https://..." /><div className="form-field"><span>Category</span><CustomSelect value={form.category} options={categoryOptions} onChange={(v) => set('category', v)} /></div><div className="form-field"><span>Level</span><CustomSelect value={form.level} options={levelOptions} onChange={(v) => set('level', v)} /></div><div className="form-field"><span>Status</span><CustomSelect value={form.status} options={statuses} onChange={(v) => set('status', v as Status)} /></div><div className="form-field"><span>Source</span><CustomSelect value={form.source} options={sources} onChange={(v) => set('source', v)} /></div><TextField label="Location" value={form.location} onChange={(v) => set('location', v)} /><div className="form-field"><span>Work mode</span><CustomSelect value={form.workMode} options={workModes} onChange={(v) => set('workMode', v as WorkMode)} /></div><TextField label="Date applied" type="date" value={form.dateApplied} onChange={(v) => set('dateApplied', v)} /><TextField label="Last contact" type="date" value={form.lastContact} onChange={(v) => set('lastContact', v)} /><TextField label="Next step" value={form.nextStep} onChange={(v) => set('nextStep', v)} /><div className="form-field"><span>CV version</span><CustomSelect value={form.cv} options={documents.filter((doc) => doc.type === 'CV').map((doc) => doc.name).concat(['Other'])} onChange={(v) => set('cv', v)} /></div></div><TextAreaField label="Requirements" value={form.requirements} onChange={(v) => set('requirements', v)} placeholder="C#, SQL, Git..." /><TextAreaField label="Benefits" value={form.benefits} onChange={(v) => set('benefits', v)} placeholder="Hybrid work, mentoring..." /><TextAreaField label="Notes" value={form.notes} onChange={(v) => set('notes', v)} placeholder="What should you remember?" /><ModalFooter onClose={onClose} submitLabel={application ? 'Save changes' : 'Save application'} /></form></BaseModal>;
}

function ProfileCustomizationModal({ profile, setProfile, settings, setSettings, activeTab, setActiveTab, theme, setTheme, onClose, onExport, onBackup, onReset }: { profile: Profile; setProfile: (profile: Profile) => void; settings: AppSettings; setSettings: (settings: AppSettings) => void; activeTab: ProfileTab; setActiveTab: (tab: ProfileTab) => void; theme: Theme; setTheme: (theme: Theme) => void; onClose: () => void; onExport: () => void; onBackup: () => void; onReset: () => void }) {
  const [draftProfile, setDraftProfile] = useState(profile);
  const [draftSettings, setDraftSettings] = useState(settings);
  const [draftTheme, setDraftTheme] = useState(theme);
  const tabs: { id: ProfileTab; label: string; icon: typeof User }[] = [{ id: 'profile', label: 'Profile', icon: User }, { id: 'appearance', label: 'Appearance', icon: Palette }, { id: 'notifications', label: 'Notifications', icon: Bell }, { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal }, { id: 'data', label: 'Data', icon: Database }];
  function save() {
    setProfile(draftProfile);
    setSettings(draftSettings);
    setTheme(draftTheme);
    onClose();
  }
  return <div className="modal-backdrop"><section className="settings-modal" role="dialog" aria-modal="true"><header className="modal-header"><div><h2>Profile & customization</h2><p>Manage your profile, preferences and app settings.</p></div><button className="close-button" type="button" onClick={onClose}><X size={20} /></button></header><div className="settings-body"><aside className="settings-tabs">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} type="button" onClick={() => setActiveTab(tab.id)}><Icon size={17} /> {tab.label}</button>; })}</aside><main className="settings-content custom-scroll">{activeTab === 'profile' ? <ProfileTab profile={draftProfile} setProfile={setDraftProfile} /> : null}{activeTab === 'appearance' ? <AppearanceTab theme={draftTheme} setTheme={setDraftTheme} settings={draftSettings} setSettings={setDraftSettings} /> : null}{activeTab === 'notifications' ? <NotificationsTab settings={draftSettings} setSettings={setDraftSettings} /> : null}{activeTab === 'preferences' ? <PreferencesTab settings={draftSettings} setSettings={setDraftSettings} /> : null}{activeTab === 'data' ? <DataTab onExport={onExport} onBackup={onBackup} onReset={onReset} /> : null}</main></div><footer className="modal-footer"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" onClick={save}><CheckCircle2 size={17} /> Save changes</button></footer></section></div>;
}

function ProfileTab({ profile, setProfile }: { profile: Profile; setProfile: (profile: Profile) => void }) {
  const [avatarVariant, setAvatarVariant] = useState(0);
  const avatarLabels = ['Neutral icon', 'Soft circle', 'Initials'];
  return <div className="tab-content"><div className="profile-photo-row"><span className={`profile-photo avatar-variant-${avatarVariant}`}>{avatarVariant === 2 ? getInitials(profile.name) : <User size={31} />}</span><div><h3>Profile photo</h3><p>Mock avatar variant: {avatarLabels[avatarVariant]}.</p><button className="text-button strong" type="button" onClick={() => setAvatarVariant((avatarVariant + 1) % avatarLabels.length)}>Change avatar</button></div></div><div className="form-grid"><TextField label="Full name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} /><TextField label="Email address" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} /><TextField label="Job search title" value={profile.title} onChange={(v) => setProfile({ ...profile, title: v })} /><TextField label="Current city" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} /><TextField label="Portfolio URL" value={profile.portfolioUrl} onChange={(v) => setProfile({ ...profile, portfolioUrl: v })} /><TextField label="LinkedIn URL" value={profile.linkedInUrl} onChange={(v) => setProfile({ ...profile, linkedInUrl: v })} /><TextField label="GitHub URL" value={profile.githubUrl} onChange={(v) => setProfile({ ...profile, githubUrl: v })} /><div className="form-field"><span>Preferred work mode</span><CustomSelect value={profile.workMode} options={workModes} onChange={(v) => setProfile({ ...profile, workMode: v as WorkMode })} /></div></div></div>;
}

function AppearanceTab({ theme, setTheme, settings, setSettings }: { theme: Theme; setTheme: (theme: Theme) => void; settings: AppSettings; setSettings: (settings: AppSettings) => void }) {
  return <div className="tab-content"><div className="setting-group"><span className="setting-label">Theme</span><div className="segmented-row"><button className={theme === 'light' ? 'selected' : ''} type="button" onClick={() => setTheme('light')}><Sun size={16} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} type="button" onClick={() => setTheme('dark')}><Moon size={16} /> Dark</button><button type="button" onClick={() => setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')}><Monitor size={16} /> System</button></div></div><div className="setting-group"><span className="setting-label">Accent color</span><div className="color-row">{(['Taupe', 'Champagne', 'Dusty rose', 'Soft brown', 'Beige'] as AppSettings['accent'][]).map((color) => <button className={`color-dot ${settings.accent === color ? 'selected' : ''} ${color.toLowerCase().replaceAll(' ', '-')}`} type="button" key={color} onClick={() => setSettings({ ...settings, accent: color })}><span />{color}</button>)}</div></div><div className="setting-group"><span className="setting-label">Layout density</span><div className="segmented-row"><button className={settings.density === 'Comfortable' ? 'selected' : ''} type="button" onClick={() => setSettings({ ...settings, density: 'Comfortable' })}>Comfortable</button><button className={settings.density === 'Compact' ? 'selected' : ''} type="button" onClick={() => setSettings({ ...settings, density: 'Compact' })}>Compact</button></div></div><ToggleRow title="Show motivational card in sidebar" text="Display cozy inspiration card at the bottom of the sidebar." checked={settings.showMotivation} onChange={(value) => setSettings({ ...settings, showMotivation: value })} /><ToggleRow title="Enable subtle animations" text="Smooth transitions for cards, modals and page changes." checked={settings.animations} onChange={(value) => setSettings({ ...settings, animations: value })} /></div>;
}

function ToggleRow({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="toggle-row"><div><strong>{title}</strong><span>{text}</span></div><button className={`toggle ${checked ? 'on' : ''}`} type="button" onClick={() => onChange(!checked)}><span /></button></div>;
}

function NotificationsTab({ settings, setSettings }: { settings: AppSettings; setSettings: (settings: AppSettings) => void }) {
  const n = settings.notifications;
  function patch(patchValue: Partial<AppSettings['notifications']>) { setSettings({ ...settings, notifications: { ...n, ...patchValue } }); }
  return <div className="tab-content narrow-settings"><ToggleRow title="Interview reminders" text="Remind me 24h and 1h before each interview." checked={n.interviews} onChange={(value) => patch({ interviews: value })} /><ToggleRow title="Follow-up reminders" text="Remind me to follow up after no response." checked={n.followUps} onChange={(value) => patch({ followUps: value })} /><ToggleRow title="Application deadlines" text="Alerts for deadlines set on offers." checked={n.deadlines} onChange={(value) => patch({ deadlines: value })} /><ToggleRow title="Weekly recruitment summary" text="Every Monday overview of the past week." checked={n.weekly} onChange={(value) => patch({ weekly: value })} /><ToggleRow title="Monthly statistics report" text="First of each month recruitment statistics." checked={n.monthly} onChange={(value) => patch({ monthly: value })} /><div className="form-field slim"><span>Default reminder time</span><CustomSelect value={n.reminderTime} options={['15 minutes before', '1 hour before', '1 day before']} onChange={(value) => patch({ reminderTime: value })} /></div></div>;
}

function PreferencesTab({ settings, setSettings }: { settings: AppSettings; setSettings: (settings: AppSettings) => void }) {
  const prefs = settings.preferences;
  const [newCategory, setNewCategory] = useState('');
  const [newLevel, setNewLevel] = useState('');
  function patch(patchValue: Partial<AppSettings['preferences']>) { setSettings({ ...settings, preferences: { ...prefs, ...patchValue } }); }
  function toggleString(key: 'categories' | 'levels', value: string) { const current = prefs[key]; patch({ [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] } as Partial<AppSettings['preferences']>); }
  function toggleMode(mode: WorkMode) {
    if (mode === allWorkModes) {
      patch({ workModes: prefs.workModes.includes(allWorkModes) ? [] : [allWorkModes] });
      return;
    }

    const current = prefs.workModes.filter((item) => item !== allWorkModes);
    patch({ workModes: current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode] });
  }
  function addCustom(key: 'categories' | 'levels', value: string, clear: (value: string) => void) {
    const clean = value.trim();
    if (!clean) return;
    const current = prefs[key];
    if (!current.includes(clean)) patch({ [key]: [...current, clean] } as Partial<AppSettings['preferences']>);
    clear('');
  }
  const categoryItems = uniqueOptions(categories, prefs.categories);
  const levelItems = uniqueOptions(levels, prefs.levels);
  function setLocationPreferences(locations: PreferredLocationPreference[]) {
    patch({ locationPreferences: locations, locations: locations.map((location) => location.city) });
  }
  return <div className="tab-content"><PreferenceGroup title="Preferred categories" items={categoryItems} selected={prefs.categories} onToggle={(value) => toggleString('categories', value)} addValue={newCategory} setAddValue={setNewCategory} onAdd={() => addCustom('categories', newCategory, setNewCategory)} addPlaceholder="Add custom category" /><PreferenceGroup title="Preferred job levels" items={levelItems} selected={prefs.levels} onToggle={(value) => toggleString('levels', value)} addValue={newLevel} setAddValue={setNewLevel} onAdd={() => addCustom('levels', newLevel, setNewLevel)} addPlaceholder="Add custom level" /><PreferredLocationsEditor locations={prefs.locationPreferences} onChange={setLocationPreferences} /><PreferenceGroup title="Preferred work modes" items={workModes} selected={prefs.workModes} onToggle={(value) => toggleMode(value as WorkMode)} /><div className="rules-grid"><NumberStepper label="Mark as no response after" value={prefs.noResponseDays} onChange={(value) => patch({ noResponseDays: value })} /><NumberStepper label="Mark as ghosted after" value={prefs.ghostedDays} onChange={(value) => patch({ ghostedDays: value })} /><NumberStepper label="Suggest follow-up after" value={prefs.followUpDays} onChange={(value) => patch({ followUpDays: value })} /></div></div>;
}

function PreferredLocationsEditor({ locations, onChange }: { locations: PreferredLocationPreference[]; onChange: (locations: PreferredLocationPreference[]) => void }) {
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(30);
  const suggestedCities = ['Warsaw', 'Krakow', 'Wroclaw', 'Gdansk', 'Lodz', 'Poznan', 'Katowice'];

  function addLocation() {
    const cleanCity = city.trim();
    if (!cleanCity) return;
    const existing = locations.find((location) => location.city.toLowerCase() === cleanCity.toLowerCase());
    const nextLocation: PreferredLocationPreference = {
      id: existing?.id || `location-${Date.now()}`,
      city: cleanCity,
      radiusKm: Math.min(500, Math.max(0, Math.round(radiusKm)))
    };

    onChange(existing ? locations.map((location) => location.id === existing.id ? nextLocation : location) : [...locations, nextLocation]);
    setCity('');
  }

  return (
    <div className="preference-group location-preferences">
      <span className="setting-label">Preferred locations</span>
      <div className="location-suggestions">
        {suggestedCities.map((suggestedCity) => (
          <button key={suggestedCity} className={locations.some((location) => location.city.toLowerCase() === suggestedCity.toLowerCase()) ? 'selected' : ''} type="button" onClick={() => setCity(suggestedCity)}>
            {suggestedCity}
          </button>
        ))}
      </div>
      <div className="location-add-row">
        <TextField label="City" value={city} onChange={setCity} placeholder="Add city" />
        <NumberStepper label="Distance" value={radiusKm} onChange={setRadiusKm} min={0} max={500} unit="km" />
        <button className="secondary-button location-add-button" type="button" onClick={addLocation}><Plus size={15} /> Add</button>
      </div>
      <div className="location-rule-list">
        {locations.map((location) => (
          <article className="location-rule-card" key={location.id}>
            <div className="location-rule-name"><MapPin size={17} /><div><strong>{location.city}</strong><small>Search within selected radius</small></div></div>
            <NumberStepper label="Radius" value={location.radiusKm} onChange={(value) => onChange(locations.map((item) => item.id === location.id ? { ...item, radiusKm: value } : item))} min={0} max={500} unit="km" />
            <button className="ghost-icon danger" type="button" aria-label={`Remove ${location.city}`} onClick={() => onChange(locations.filter((item) => item.id !== location.id))}><Trash2 size={16} /></button>
          </article>
        ))}
      </div>
    </div>
  );
}

function PreferenceGroup({ title, items, selected, onToggle, addValue, setAddValue, onAdd, addPlaceholder }: { title: string; items: string[]; selected: string[]; onToggle: (item: string) => void; addValue?: string; setAddValue?: (value: string) => void; onAdd?: () => void; addPlaceholder?: string }) {
  return <div className="preference-group"><span className="setting-label">{title}</span><div className="preference-pills">{items.map((item) => <button key={item} className={selected.includes(item) ? 'selected' : ''} type="button" onClick={() => onToggle(item)}>{item}</button>)}</div>{setAddValue && onAdd ? <div className="add-custom-row"><input value={addValue || ''} placeholder={addPlaceholder || 'Add custom'} onChange={(event) => setAddValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd(); } }} /><button className="secondary-button small" type="button" onClick={onAdd}><Plus size={15} /> Add</button></div> : null}</div>;
}

function DataTab({ onExport, onBackup, onReset }: { onExport: () => void; onBackup: () => void; onReset: () => void }) {
  return <div className="data-actions"><button className="data-action" type="button" onClick={() => alert('Import CSV will be connected to backend later.')}><span className="blue"><Upload size={20} /></span><div><strong>Import CSV</strong><p>Mock action for future import flow.</p></div></button><button className="data-action" type="button" onClick={onExport}><span className="green"><Download size={20} /></span><div><strong>Export CSV</strong><p>Download all applications as a CSV file.</p></div></button><button className="data-action" type="button" onClick={onBackup}><span className="beige"><Database size={20} /></span><div><strong>Backup data</strong><p>Save a complete JSON backup of local demo data.</p></div></button><button className="data-action" type="button" onClick={onReset}><span className="danger"><Trash2 size={20} /></span><div><strong>Reset demo data</strong><p>Restore mock data and clear local changes.</p></div></button></div>;
}

function Toast({ message }: { message: string }) {
  return <div className="toast"><CheckCircle2 size={17} /> {message}</div>;
}

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

type MobileLayoutProps = {
  shellClass: string;
  page: Page;
  setPage: (page: Page) => void;
  profile: Profile;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  settings: AppSettings;
  applications: JobApplication[];
  companies: Company[];
  events: CalendarEvent[];
  documents: DocumentItem[];
  notes: NoteItem[];
  setCompanies: (companies: Company[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  setDocuments: (documents: DocumentItem[]) => void;
  setNotes: (notes: NoteItem[]) => void;
  setToast: (value: string) => void;
  onOpenApplication: () => void;
  onOpenEditApplication: (application: JobApplication) => void;
  onStatusChange: (id: number, status: Status) => void;
  onDeleteApplication: (id: number) => void;
  onOpenSettings: (tab?: ProfileTab) => void;
  onLogout: () => void;
  onExport: () => void;
  onAddApplicationFromScout: (match: JobScoutMatch) => void;
  categoryOptions: string[];
  levelOptions: string[];
  children?: React.ReactNode;
};

function MobileLayout({
  shellClass,
  page,
  setPage,
  profile,
  theme,
  setTheme,
  settings,
  applications,
  companies,
  events,
  documents,
  notes,
  setCompanies,
  setEvents,
  setDocuments,
  setNotes,
  setToast,
  onOpenApplication,
  onOpenEditApplication,
  onStatusChange,
  onDeleteApplication,
  onOpenSettings,
  onLogout,
  onExport,
  onAddApplicationFromScout,
  categoryOptions,
  levelOptions,
  children
}: MobileLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  function openAddApplication() {
    setPage('applications');
    onOpenApplication();
  }

  return (
    <div className={`${shellClass} mobile-app-shell`}>
      <MobileHeader
        page={page}
        profile={profile}
        theme={theme}
        setTheme={setTheme}
        onOpenSettings={onOpenSettings}
      />

      <main className="mobile-content custom-scroll">
        {page === 'dashboard' ? (
          <MobileDashboardPage
            applications={applications}
            events={events}
            setPage={setPage}
            onOpenEditApplication={onOpenEditApplication}
          />
        ) : null}

        {page === 'applications' ? (
          <MobileApplicationsPage
            applications={applications}
            onOpenApplication={openAddApplication}
            onOpenEditApplication={onOpenEditApplication}
            onStatusChange={onStatusChange}
            onDelete={onDeleteApplication}
            onExport={onExport}
            categoryOptions={categoryOptions}
            levelOptions={levelOptions}
          />
        ) : null}

        {page === 'calendar' ? (
          <MobileCalendarPage events={events} applications={applications} setEvents={setEvents} setToast={setToast} />
        ) : null}

        {page === 'notes' ? <NotesPage notes={notes} setNotes={setNotes} setToast={setToast} /> : null}
        {page === 'companies' ? <CompaniesPage companies={companies} applications={applications} setCompanies={setCompanies} setToast={setToast} /> : null}
        {page === 'statistics' ? <StatisticsPage applications={applications} categoryOptions={categoryOptions} /> : null}
        {page === 'documents' ? <DocumentsPage documents={documents} setDocuments={setDocuments} onExport={onExport} setToast={setToast} /> : null}
        {page === 'ai' ? <AIToolsPage documents={documents} settings={settings} setToast={setToast} onOpenSettings={onOpenSettings} onAddApplicationFromScout={onAddApplicationFromScout} /> : null}
      </main>

      <FloatingActionButton onClick={openAddApplication} label="Add application" />
      <MobileBottomNav page={page} setPage={setPage} onMore={() => setMoreOpen(true)} />

      {moreOpen ? (
        <MobileMoreMenu
          page={page}
          setPage={setPage}
          onClose={() => setMoreOpen(false)}
          onOpenSettings={onOpenSettings}
          onLogout={onLogout}
          onExport={onExport}
          theme={theme}
          setTheme={setTheme}
          settings={settings}
        />
      ) : null}

      {children}
    </div>
  );
}

function MobileHeader({ page, profile, theme, setTheme, onOpenSettings }: { page: Page; profile: Profile; theme: Theme; setTheme: (theme: Theme) => void; onOpenSettings: (tab?: ProfileTab) => void }) {
  const meta = pageLabels[page];
  const firstName = profile.name.split(' ')[0] || 'Demo';

  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <Logo />
        <div className="mobile-header-actions">
          <button className="icon-button" type="button" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="mobile-avatar-button" type="button" onClick={() => onOpenSettings('profile')} aria-label="Open profile">
            <span>{getInitials(firstName)}</span>
          </button>
        </div>
      </div>
      <div className="mobile-page-title">
        <span>{firstName}'s job tracker</span>
        <h1>{page === 'dashboard' ? `Good morning, ${firstName}` : meta.title}</h1>
        <p>{page === 'dashboard' ? 'Your next recruitment steps in one calm view.' : meta.subtitle}</p>
      </div>
    </header>
  );
}

function MobileBottomNav({ page, setPage, onMore }: { page: Page; setPage: (page: Page) => void; onMore: () => void }) {
  const primaryItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'applications', label: 'Apps', icon: BriefcaseBusiness },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'notes', label: 'Notes', icon: StickyNote }
  ];
  const moreActive = !primaryItems.some((item) => item.id === page);

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} type="button" className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}>
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <button type="button" className={moreActive ? 'active' : ''} onClick={onMore}>
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
    </nav>
  );
}

function FloatingActionButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="mobile-fab" type="button" onClick={onClick} aria-label={label}>
      <Plus size={22} />
      <span>{label}</span>
    </button>
  );
}

function MobileMoreMenu({ page, setPage, onClose, onOpenSettings, onLogout, onExport, theme, setTheme, settings }: { page: Page; setPage: (page: Page) => void; onClose: () => void; onOpenSettings: (tab?: ProfileTab) => void; onLogout: () => void; onExport: () => void; theme: Theme; setTheme: (theme: Theme) => void; settings: AppSettings }) {
  const items: { id: Page; label: string; icon: typeof Building2; description: string }[] = [
    { id: 'companies', label: 'Companies', icon: Building2, description: 'Company history and contacts' },
    { id: 'statistics', label: 'Statistics', icon: BarChart3, description: 'Progress and response rates' },
    { id: 'documents', label: 'Documents', icon: FileText, description: 'CVs, links and files' },
    { id: 'ai', label: 'AI Tools', icon: Sparkles, description: 'CV review, cover letters and Job Scout' }
  ];

  return (
    <MobileBottomSheet title="More" subtitle="Secondary pages and app options." onClose={onClose}>
      <div className="mobile-more-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={page === item.id ? 'active' : ''} onClick={() => { setPage(item.id); onClose(); }}>
              <span className="mobile-more-icon"><Icon size={19} /></span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </div>
            </button>
          );
        })}
        <button type="button" onClick={() => { onOpenSettings('profile'); onClose(); }}>
          <span className="mobile-more-icon"><User size={19} /></span>
          <div><strong>Profile & settings</strong><small>Profile, notifications and preferences</small></div>
        </button>
        <button type="button" onClick={() => { onOpenSettings('appearance'); onClose(); }}>
          <span className="mobile-more-icon"><Palette size={19} /></span>
          <div><strong>Appearance</strong><small>{theme} Â· {settings.accent}</small></div>
        </button>
        <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          <span className="mobile-more-icon">{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</span>
          <div><strong>Switch theme</strong><small>Change between light and dark mode</small></div>
        </button>
        <button type="button" onClick={onExport}>
          <span className="mobile-more-icon"><Download size={19} /></span>
          <div><strong>Export CSV</strong><small>Download applications data</small></div>
        </button>
        <button type="button" className="danger" onClick={onLogout}>
          <span className="mobile-more-icon"><LogOut size={19} /></span>
          <div><strong>Log out</strong><small>Exit demo session</small></div>
        </button>
      </div>
    </MobileBottomSheet>
  );
}

function MobileBottomSheet({ title, subtitle, onClose, children, className = '' }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; className?: string }) {
  return (
    <div className="mobile-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`mobile-bottom-sheet ${className}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <header className="mobile-sheet-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <div className="mobile-sheet-body custom-scroll">{children}</div>
      </section>
    </div>
  );
}

function MobileDashboardPage({ applications, events, setPage, onOpenEditApplication }: { applications: JobApplication[]; events: CalendarEvent[]; setPage: (page: Page) => void; onOpenEditApplication: (app: JobApplication) => void }) {
  const stats = calculateStats(applications);
  const nextActions = applications
    .filter((app) => ['Interview', 'Task / test', 'No response', 'Ghosted', 'In progress'].includes(app.status))
    .slice(0, 4);
  const recent = [...applications].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied)).slice(0, 3);
  const upcoming = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 3);

  return (
    <section className="mobile-dashboard">
      <div className="mobile-metrics-row custom-scroll">
        <MetricCard label="Total" value={stats.total} hint="applications" />
        <MetricCard label="Active" value={stats.active} hint="open processes" tone="blue-text" />
        <MetricCard label="Interviews" value={stats.interviews} hint="positive stages" tone="rose-text" />
        <MetricCard label="Response" value={`${stats.responseRate}%`} hint="all time" tone="green-text" />
      </div>

      <section className="mobile-section-card">
        <div className="mobile-section-head">
          <div><h2>Next actions</h2><p>Things worth checking first.</p></div>
          <button type="button" onClick={() => setPage('applications')}>All</button>
        </div>
        <div className="mobile-action-list">
          {nextActions.map((app) => <MobileActionItem key={app.id} application={app} onClick={() => onOpenEditApplication(app)} />)}
          {!nextActions.length ? <MobileEmptyState icon={CheckCircle2} title="Nothing urgent" text="No urgent recruitment steps for now." /> : null}
        </div>
      </section>

      <section className="mobile-section-card">
        <div className="mobile-section-head">
          <div><h2>Recent applications</h2><p>Latest saved entries.</p></div>
          <button type="button" onClick={() => setPage('applications')}>Open</button>
        </div>
        <div className="mobile-card-list compact">
          {recent.map((app) => <MobileApplicationCard key={app.id} application={app} onOpen={() => onOpenEditApplication(app)} onEdit={() => onOpenEditApplication(app)} />)}
        </div>
      </section>

      <section className="mobile-section-card">
        <div className="mobile-section-head">
          <div><h2>Agenda</h2><p>Upcoming recruitment events.</p></div>
          <button type="button" onClick={() => setPage('calendar')}>Calendar</button>
        </div>
        <div className="mobile-agenda-list">
          {upcoming.map((event) => <MobileAgendaItem key={event.id} event={event} />)}
          {!upcoming.length ? <MobileEmptyState icon={CalendarDays} title="No events" text="Add interviews and reminders to your calendar." /> : null}
        </div>
      </section>
    </section>
  );
}

function MobileActionItem({ application, onClick }: { application: JobApplication; onClick: () => void }) {
  return (
    <button className="mobile-action-item" type="button" onClick={onClick}>
      <CompanyLogo name={application.company} domain={application.domain} />
      <div>
        <strong>{application.nextStep || application.status}</strong>
        <span>{application.company} Â· {application.position}</span>
      </div>
      <StatusBadge status={application.status} />
    </button>
  );
}

function MobileApplicationsPage({ applications, onOpenApplication, onOpenEditApplication, onStatusChange, onDelete, onExport, categoryOptions, levelOptions }: { applications: JobApplication[]; onOpenApplication: () => void; onOpenEditApplication: (app: JobApplication) => void; onStatusChange: (id: number, status: Status) => void; onDelete: (id: number) => void; onExport: () => void; categoryOptions: string[]; levelOptions: string[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [location, setLocation] = useState('All');
  const [mode, setMode] = useState('All');
  const [source, setSource] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [details, setDetails] = useState<JobApplication | null>(null);

  const locations = useMemo(() => ['All', ...Array.from(new Set(applications.map((app) => app.location))).filter(Boolean)], [applications]);
  const filtered = useMemo(() => applications.filter((app) => {
    const search = `${app.company} ${app.position} ${app.category} ${app.source} ${app.location}`.toLowerCase();
    return search.includes(query.toLowerCase()) &&
      (status === 'All' || app.status === status) &&
      (category === 'All' || app.category === category) &&
      (level === 'All' || app.level === level) &&
      (location === 'All' || app.location === location) &&
      (mode === 'All' || app.workMode === mode) &&
      (source === 'All' || app.source === source);
  }), [applications, query, status, category, level, location, mode, source]);

  const activeFilters = [status, category, level, location, mode, source].filter((value) => value !== 'All');
  const hasFilters = query || activeFilters.length > 0;

  function clearFilters() {
    setQuery('');
    setStatus('All');
    setCategory('All');
    setLevel('All');
    setLocation('All');
    setMode('All');
    setSource('All');
  }

  return (
    <section className="mobile-applications-page">
      <div className="mobile-search-row">
        <label className="mobile-search-field">
          <Search size={18} />
          <input placeholder="Search applications..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button className="mobile-filter-button" type="button" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={18} />
          <span>Filters</span>
          {activeFilters.length ? <strong>{activeFilters.length}</strong> : null}
        </button>
      </div>

      <div className="mobile-filter-chips custom-scroll">
        {activeFilters.map((filter) => <span key={filter}>{filter}</span>)}
        {hasFilters ? <button type="button" onClick={clearFilters}>Clear</button> : null}
      </div>

      <div className="mobile-list-summary">
        <div><strong>{filtered.length}</strong><span>{filtered.length === 1 ? 'application' : 'applications'}</span></div>
        <div className="mobile-list-actions">
          <button type="button" onClick={onExport}><Download size={16} /> Export</button>
          <button type="button" onClick={onOpenApplication}><Plus size={16} /> Add</button>
        </div>
      </div>

      <div className="mobile-card-list">
        {filtered.map((app) => (
          <MobileApplicationCard
            key={app.id}
            application={app}
            onOpen={() => setDetails(app)}
            onEdit={() => onOpenEditApplication(app)}
            onDelete={() => onDelete(app.id)}
            onStatusChange={(nextStatus) => onStatusChange(app.id, nextStatus)}
          />
        ))}
        {!filtered.length ? <MobileEmptyState icon={Folder} title="No results" text="Try changing filters or add a new application." /> : null}
      </div>

      {filtersOpen ? (
        <MobileFiltersSheet
          status={status}
          setStatus={setStatus}
          category={category}
          setCategory={setCategory}
          level={level}
          setLevel={setLevel}
          location={location}
          setLocation={setLocation}
          mode={mode}
          setMode={setMode}
          source={source}
          setSource={setSource}
          locations={locations}
          categoryOptions={categoryOptions}
          levelOptions={levelOptions}
          onClose={() => setFiltersOpen(false)}
          onClear={clearFilters}
        />
      ) : null}

      {details ? (
        <ApplicationDetailsSheet
          application={details}
          onClose={() => setDetails(null)}
          onEdit={() => {
            setDetails(null);
            onOpenEditApplication(details);
          }}
          onDelete={() => {
            onDelete(details.id);
            setDetails(null);
          }}
        />
      ) : null}
    </section>
  );
}

function MobileApplicationCard({ application, onOpen, onEdit, onDelete, onStatusChange }: { application: JobApplication; onOpen: () => void; onEdit: () => void; onDelete?: () => void; onStatusChange?: (status: Status) => void }) {
  return (
    <article className="mobile-application-card">
      <button className="mobile-card-main" type="button" onClick={onOpen}>
        <div className="mobile-card-topline">
          <div className="mobile-card-company">
            <CompanyLogo name={application.company} domain={application.domain} />
            <div>
              <strong>{application.company}</strong>
              <span>{application.location} Â· {application.workMode}</span>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>
        <h2>{application.position}</h2>
        <div className="mobile-card-meta">
          <span>{application.category}</span>
          <span>{application.level}</span>
          <span>{formatDate(application.dateApplied)}</span>
        </div>
        <div className="mobile-next-step"><Clock size={15} /><span>Next: {application.nextStep || 'Waiting'}</span></div>
      </button>
      <div className="mobile-card-actions-row">
        {onStatusChange ? (
          <select value={application.status} onChange={(event) => onStatusChange(event.target.value as Status)} aria-label={`Change status for ${application.company}`}>
            {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : null}
        <button type="button" onClick={() => application.offerUrl && window.open(application.offerUrl, '_blank')}><ExternalLink size={16} /> Open</button>
        <button type="button" onClick={onEdit}><Pencil size={16} /> Edit</button>
        {onDelete ? <button className="danger" type="button" onClick={onDelete}><Trash2 size={16} /></button> : null}
      </div>
    </article>
  );
}

function MobileFiltersSheet({ status, setStatus, category, setCategory, level, setLevel, location, setLocation, mode, setMode, source, setSource, locations, categoryOptions, levelOptions, onClose, onClear }: { status: string; setStatus: (value: string) => void; category: string; setCategory: (value: string) => void; level: string; setLevel: (value: string) => void; location: string; setLocation: (value: string) => void; mode: string; setMode: (value: string) => void; source: string; setSource: (value: string) => void; locations: string[]; categoryOptions: string[]; levelOptions: string[]; onClose: () => void; onClear: () => void }) {
  return (
    <MobileBottomSheet title="Filters" subtitle="Narrow down your recruitment list." onClose={onClose} className="mobile-filters-sheet">
      <div className="mobile-filter-grid">
        <div className="form-field"><span>Status</span><CustomSelect value={status} options={['All', ...statuses]} onChange={setStatus} /></div>
        <div className="form-field"><span>Category</span><CustomSelect value={category} options={['All', ...categoryOptions]} onChange={setCategory} /></div>
        <div className="form-field"><span>Level</span><CustomSelect value={level} options={['All', ...levelOptions]} onChange={setLevel} /></div>
        <div className="form-field"><span>Location</span><CustomSelect value={location} options={locations} onChange={setLocation} /></div>
        <div className="form-field"><span>Work mode</span><CustomSelect value={mode} options={['All', ...workModes]} onChange={setMode} /></div>
        <div className="form-field"><span>Source</span><CustomSelect value={source} options={['All', ...sources]} onChange={setSource} /></div>
      </div>
      <div className="mobile-sheet-actions">
        <button className="secondary-button" type="button" onClick={onClear}>Clear</button>
        <button className="primary-button" type="button" onClick={onClose}>Show results</button>
      </div>
    </MobileBottomSheet>
  );
}

function ApplicationDetailsSheet({ application, onClose, onEdit, onDelete }: { application: JobApplication; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <MobileBottomSheet title="Application details" subtitle={`${application.company} Â· ${application.position}`} onClose={onClose} className="mobile-application-details-sheet">
      <div className="mobile-detail-hero">
        <CompanyLogo name={application.company} domain={application.domain} large />
        <div>
          <h2>{application.position}</h2>
          <p>{application.company}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="mobile-detail-grid">
        <div><span>Date applied</span><strong>{formatDate(application.dateApplied)}</strong></div>
        <div><span>Last contact</span><strong>{formatDate(application.lastContact)}</strong></div>
        <div><span>Work mode</span><strong>{application.workMode}</strong></div>
        <div><span>Source</span><strong>{application.source}</strong></div>
      </div>

      <div className="mobile-detail-section">
        <h3>Next step</h3>
        <p>{application.nextStep || 'Waiting'}</p>
      </div>
      <div className="mobile-detail-section">
        <h3>Requirements</h3>
        <p>{application.requirements || 'No requirements saved yet.'}</p>
      </div>
      <div className="mobile-detail-section">
        <h3>Notes</h3>
        <p>{application.notes || 'No notes saved yet.'}</p>
      </div>

      <div className="mobile-sheet-actions sticky-actions">
        <button className="secondary-button" type="button" onClick={() => application.offerUrl && window.open(application.offerUrl, '_blank')}><ExternalLink size={17} /> Offer</button>
        <button className="secondary-button" type="button" onClick={onEdit}><Pencil size={17} /> Edit</button>
        <button className="secondary-button danger-button" type="button" onClick={onDelete}><Trash2 size={17} /> Delete</button>
      </div>
    </MobileBottomSheet>
  );
}

function MobileCalendarPage({ events, applications, setEvents, setToast }: { events: CalendarEvent[]; applications: JobApplication[]; setEvents: (events: CalendarEvent[]) => void; setToast: (value: string) => void }) {
  const [modal, setModal] = useState<CalendarEvent | null>(null);
  const sorted = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const grouped = sorted.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    acc[event.date] = acc[event.date] || [];
    acc[event.date].push(event);
    return acc;
  }, {});

  function save(event: CalendarEvent) {
    if (events.some((item) => item.id === event.id)) setEvents(events.map((item) => item.id === event.id ? event : item));
    else setEvents([event, ...events]);
    setModal(null);
    setToast('Calendar event saved.');
  }

  function remove(id: number) {
    setEvents(events.filter((event) => event.id !== id));
    setToast('Calendar event removed.');
  }

  function addEvent() {
    setModal({ id: 0, title: '', company: applications[0]?.company || '', applicationId: applications[0]?.id, date: today(), time: '10:00', type: 'HR interview', location: 'Online', meetingLink: '', notes: '' });
  }

  return (
    <section className="mobile-calendar-page">
      <div className="mobile-list-summary">
        <div><strong>{events.length}</strong><span>events</span></div>
        <div className="mobile-list-actions"><button type="button" onClick={addEvent}><Plus size={16} /> Add event</button></div>
      </div>
      <div className="mobile-agenda-groups">
        {Object.entries(grouped).map(([date, dayEvents]) => (
          <section className="mobile-agenda-group" key={date}>
            <h2>{formatDate(date)}</h2>
            {dayEvents.map((event) => (
              <div className="mobile-calendar-event" key={event.id}>
                <button type="button" onClick={() => setModal(event)}>
                  <span>{event.time}</span>
                  <div><strong>{event.title}</strong><small>{event.company} Â· {event.location}</small></div>
                </button>
                <button className="ghost-icon" type="button" onClick={() => setModal(event)}><Pencil size={16} /></button>
                <button className="ghost-icon danger" type="button" onClick={() => remove(event.id)}><Trash2 size={16} /></button>
              </div>
            ))}
          </section>
        ))}
        {!events.length ? <MobileEmptyState icon={CalendarDays} title="No events" text="Add interviews, tests and follow-up reminders." /> : null}
      </div>
      {modal ? <EventModal event={modal} applications={applications} onClose={() => setModal(null)} onSave={save} /> : null}
    </section>
  );
}

function MobileAgendaItem({ event }: { event: CalendarEvent }) {
  return (
    <div className="mobile-agenda-item">
      <span>{event.time}</span>
      <div>
        <strong>{event.title}</strong>
        <small>{formatDate(event.date)} Â· {event.company}</small>
      </div>
    </div>
  );
}

function MobileEmptyState({ icon: Icon, title, text }: { icon: typeof Folder; title: string; text: string }) {
  return (
    <div className="mobile-empty-state">
      <Icon size={26} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}


function App() {
  const [isLoggedIn, setLoggedIn] = useState(() => readStorage(STORAGE.session, false));
  const [profile, setProfile] = useState<Profile>(() => normalizeProfile(readStorage(STORAGE.profile, initialProfile)));
  const [settings, setSettings] = useState<AppSettings>(() => normalizeSettings(readStorage(STORAGE.settings, initialSettings)));
  const [applications, setApplications] = useState<JobApplication[]>(() => readStorage(STORAGE.applications, initialApplications));
  const [companies, setCompanies] = useState<Company[]>(() => readStorage(STORAGE.companies, initialCompanies));
  const [events, setEvents] = useState<CalendarEvent[]>(() => readStorage(STORAGE.events, initialEvents));
  const [documents, setDocuments] = useState<DocumentItem[]>(() => readStorage(STORAGE.documents, initialDocuments));
  const [notes, setNotes] = useState<NoteItem[]>(() => readStorage(STORAGE.notes, initialNotes));
  const [theme, setTheme] = useState<Theme>(() => readStorage(STORAGE.theme, 'light'));
  const [page, setPage] = useState<Page>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<ProfileTab>('profile');
  const [editingApplication, setEditingApplication] = useState<JobApplication | null | undefined>(undefined);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => writeStorage(STORAGE.profile, profile), [profile]);
  useEffect(() => writeStorage(STORAGE.settings, settings), [settings]);
  useEffect(() => writeStorage(STORAGE.applications, applications), [applications]);
  useEffect(() => writeStorage(STORAGE.companies, companies), [companies]);
  useEffect(() => writeStorage(STORAGE.events, events), [events]);
  useEffect(() => writeStorage(STORAGE.documents, documents), [documents]);
  useEffect(() => writeStorage(STORAGE.notes, notes), [notes]);
  useEffect(() => writeStorage(STORAGE.theme, theme), [theme]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timeout); }, [toast]);

  function login(nextProfile: Profile) { setProfile(nextProfile); setLoggedIn(true); writeStorage(STORAGE.session, true); }
  function logout() { writeStorage(STORAGE.session, false); setLoggedIn(false); }
  function openSettings(tab: ProfileTab = 'profile') { setSettingsTab(tab); setSettingsOpen(true); }
  function saveApplication(app: JobApplication) { const exists = applications.some((item) => item.id === app.id); const next = exists ? applications.map((item) => item.id === app.id ? app : item) : [app, ...applications]; setApplications(next); setSelectedApplication(app); setEditingApplication(undefined); setPage('applications'); setToast(exists ? 'Application updated.' : 'Application added.'); }
  function addJobScoutApplication(match: JobScoutMatch) {
    const duplicate = applications.some((application) => application.offerUrl === match.applyUrl || (application.company === match.company && application.position === match.title));
    if (duplicate) {
      setToast('This job is already in Applications.');
      return;
    }

    const application: JobApplication = {
      id: makeId(),
      company: match.company,
      companyId: undefined,
      domain: safeDomain(match.company),
      position: match.title,
      category: settings.preferences.categories[0] || 'Other',
      level: settings.preferences.levels[0] || 'Internship',
      status: 'Saved',
      dateApplied: today(),
      lastContact: '',
      nextStep: 'Review AI Job Scout match and apply.',
      location: match.location,
      workMode: match.workMode,
      source: 'AI Job Scout',
      offerUrl: match.applyUrl,
      requirements: uniqueOptions(match.matchedSkills, match.gaps.map((gap) => `Gap: ${gap}`)).join('\n'),
      benefits: '',
      notes: [
        'Added from AI Job Scout demo.',
        `Match score: ${match.matchScore}%.`,
        `Why it matched: ${match.matchReason}`,
        `Matched tech: ${match.matchedSkills.join(', ') || '-'}.`,
        `Gaps: ${match.gaps.join(', ') || '-'}.`
      ].join('\n'),
      cv: documents.find((document) => document.type === 'CV')?.name || ''
    };

    setApplications([application, ...applications]);
    setSelectedApplication(application);
    setToast('Job Scout match added to Applications.');
  }
  function updateStatus(id: number, status: Status) { const next = applications.map((app) => app.id === id ? { ...app, status, lastContact: app.lastContact || today() } : app); setApplications(next); setSelectedApplication(next.find((app) => app.id === id) || null); setToast('Status updated.'); }
  function deleteApplication(id: number) { setApplications(applications.filter((app) => app.id !== id)); if (selectedApplication?.id === id) setSelectedApplication(null); setToast('Application removed.'); }
  function resetDemo() { if (!confirm('Reset all demo data?')) return; setApplications(initialApplications); setCompanies(initialCompanies); setEvents(initialEvents); setDocuments(initialDocuments); setNotes(initialNotes); setSettings(normalizeSettings(initialSettings)); setProfile(normalizeProfile(initialProfile)); setToast('Demo data reset.'); }
  function backup() { downloadJson('trackmycv-backup.json', { profile, settings, applications, companies, events, documents, notes }, setToast); }
  const shellClass = `app-shell ${theme === 'dark' ? 'dark' : ''} density-${settings.density.toLowerCase()} accent-${settings.accent.toLowerCase().replaceAll(' ', '-')} ${settings.animations ? 'animations-on' : 'animations-off'}`;
  const categoryOptions = uniqueOptions(categories, settings.preferences.categories);
  const levelOptions = uniqueOptions(levels, settings.preferences.levels);

  const isMobile = useIsMobile();

  if (!isLoggedIn) return <LoginPage onLogin={login} />;

  const commonOverlays = (
    <>
      {settingsOpen ? <ProfileCustomizationModal profile={profile} setProfile={setProfile} settings={settings} setSettings={setSettings} activeTab={settingsTab} setActiveTab={setSettingsTab} theme={theme} setTheme={setTheme} onClose={() => setSettingsOpen(false)} onExport={() => exportCsv(applications, setToast)} onBackup={backup} onReset={resetDemo} /> : null}
      {editingApplication !== undefined ? <ApplicationModal application={editingApplication || undefined} companies={companies} documents={documents} categoryOptions={categoryOptions} levelOptions={levelOptions} onClose={() => setEditingApplication(undefined)} onSave={saveApplication} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </>
  );

  if (isMobile) {
    return (
      <MobileLayout
        shellClass={shellClass}
        page={page}
        setPage={setPage}
        profile={profile}
        theme={theme}
        setTheme={setTheme}
        settings={settings}
        applications={applications}
        companies={companies}
        events={events}
        documents={documents}
        notes={notes}
        setCompanies={setCompanies}
        setEvents={setEvents}
        setDocuments={setDocuments}
        setNotes={setNotes}
        setToast={setToast}
        onOpenApplication={() => setEditingApplication(null)}
        onOpenEditApplication={(app) => setEditingApplication(app)}
        onStatusChange={updateStatus}
        onDeleteApplication={deleteApplication}
        onOpenSettings={openSettings}
        onLogout={logout}
        onExport={() => exportCsv(applications, setToast)}
        onAddApplicationFromScout={addJobScoutApplication}
        categoryOptions={categoryOptions}
        levelOptions={levelOptions}
      >
        {commonOverlays}
      </MobileLayout>
    );
  }

  return <div className={shellClass}><Sidebar page={page} setPage={setPage} applications={applications} settings={settings} /><div className="workspace"><Topbar page={page} profile={profile} theme={theme} setTheme={setTheme} onOpenApplication={() => setEditingApplication(null)} onOpenSettings={openSettings} onLogout={logout} setPage={setPage} /><div className="content custom-scroll">{page === 'dashboard' ? <DashboardPage applications={applications} events={events} setPage={setPage} /> : null}{page === 'applications' ? <ApplicationsPage applications={applications} onOpenApplication={() => setEditingApplication(null)} onOpenEditApplication={(app) => setEditingApplication(app)} onStatusChange={updateStatus} onDelete={deleteApplication} selectedApplication={selectedApplication} setSelectedApplication={setSelectedApplication} onExport={() => exportCsv(applications, setToast)} categoryOptions={categoryOptions} levelOptions={levelOptions} /> : null}{page === 'companies' ? <CompaniesPage companies={companies} applications={applications} setCompanies={setCompanies} setToast={setToast} /> : null}{page === 'statistics' ? <StatisticsPage applications={applications} categoryOptions={categoryOptions} /> : null}{page === 'calendar' ? <CalendarPage events={events} applications={applications} setEvents={setEvents} setToast={setToast} /> : null}{page === 'documents' ? <DocumentsPage documents={documents} setDocuments={setDocuments} onExport={() => exportCsv(applications, setToast)} setToast={setToast} /> : null}{page === 'ai' ? <AIToolsPage documents={documents} settings={settings} setToast={setToast} onOpenSettings={openSettings} onAddApplicationFromScout={addJobScoutApplication} /> : null}{page === 'notes' ? <NotesPage notes={notes} setNotes={setNotes} setToast={setToast} /> : null}</div></div>{commonOverlays}</div>;
}

export default App;



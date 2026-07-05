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
  Link as LinkIcon,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Sun,
  Tag,
  Trash2,
  Upload,
  User,
  Video,
  X
} from 'lucide-react';

type Page = 'dashboard' | 'applications' | 'companies' | 'statistics' | 'calendar' | 'documents' | 'notes';
type Theme = 'light' | 'dark';
type Status = 'Saved' | 'Applied' | 'In progress' | 'Interview' | 'Task / test' | 'Offer' | 'Rejected' | 'No response' | 'Ghosted' | 'Archived';
type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
type CalendarView = 'Month' | 'Week' | 'List';
type ProfileTab = 'profile' | 'appearance' | 'notifications' | 'preferences' | 'data';
type DocKind = 'CV' | 'Cover letter' | 'Portfolio' | 'GitHub' | 'LinkedIn' | 'Certificate' | 'Other';

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

type Profile = {
  name: string;
  email: string;
  title: string;
  location: string;
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
    workModes: WorkMode[];
    noResponseDays: number;
    ghostedDays: number;
    followUpDays: number;
  };
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
const workModes: WorkMode[] = ['Remote', 'Hybrid', 'On-site'];
const sources = ['LinkedIn', 'Just Join IT', 'Pracuj.pl', 'Company career page', 'No Fluff Jobs', 'Direct referral', 'Other'];
const eventTypes = ['HR interview', 'Technical interview', 'Recruitment task', 'Online test', 'Follow-up reminder', 'Application deadline', 'Company research', 'CV update reminder'];
const industries = ['Technology', 'Consulting', 'Software house', 'E-commerce', 'Banking', 'Cybersecurity', 'Other'];
const documentTypes: DocKind[] = ['CV', 'Cover letter', 'Portfolio', 'GitHub', 'LinkedIn', 'Certificate', 'Other'];

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
    locations: ['Remote', 'Warsaw', 'Kraków'],
    workModes: ['Hybrid', 'Remote'],
    noResponseDays: 14,
    ghostedDays: 30,
    followUpDays: 7
  }
};

const initialCompanies: Company[] = [
  { id: 1, name: 'Northstar Labs', domain: '', industry: 'Technology', location: 'Remote', website: 'https://example.com/northstar', contact: 'careers@example.com', notes: 'Fictional demo company for portfolio presentation.' },
  { id: 2, name: 'Riverstone Consulting', domain: '', industry: 'Consulting', location: 'Warsaw', website: 'https://example.com/riverstone', contact: 'recruitment@example.com', notes: 'Fictional consulting company with security roles.' },
  { id: 3, name: 'BrightPath Digital', domain: '', industry: 'Software house', location: 'Remote', website: 'https://example.com/brightpath', contact: '', notes: 'Fictional company used for demo data.' },
  { id: 4, name: 'Cloudberry Systems', domain: '', industry: 'Technology', location: 'Kraków', website: 'https://example.com/cloudberry', contact: '', notes: 'Fictional cloud and DevOps company.' },
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
  { id: 4, company: 'Cloudberry Systems', companyId: 4, domain: '', position: 'Junior DevOps Engineer', category: 'DevOps', level: 'Junior-friendly', status: 'No response', dateApplied: '2026-05-10', lastContact: '', nextStep: 'Follow-up', location: 'Kraków', workMode: 'Hybrid', source: 'Just Join IT', offerUrl: 'https://example.com/cloudberry/job-4', requirements: 'Docker, CI/CD, Linux, Git', benefits: 'Flexible hours, training, tech community', notes: 'Demo note: consider sending a follow-up.', cv: 'CV_General_IT_Demo.pdf' },
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

const initialNotes: NoteItem[] = [
  { id: 1, title: 'HR interview preparation', company: 'Riverstone Consulting', application: 'Cyber Security Analyst Intern', tag: 'Interview preparation', updated: '2026-05-21', body: 'Demo note: prepare a short introduction, motivation, project examples and questions to the recruiter.', checklist: [{ id: 1, text: 'Prepare short intro', done: true }, { id: 2, text: 'Revise role requirements', done: false }, { id: 3, text: 'Prepare questions to recruiter', done: false }] },
  { id: 2, title: 'Security topics to revise', company: 'BrightPath Digital', application: 'IAM Intern', tag: 'Technical questions', updated: '2026-05-20', body: 'Demo note: revise authentication, authorization, MFA, identity lifecycle and access management basics.', checklist: [{ id: 1, text: 'Authentication vs authorization', done: false }, { id: 2, text: 'MFA basics', done: false }] },
  { id: 3, title: '.NET technical questions', company: 'Northstar Labs', application: '.NET Developer Intern', tag: 'Technical questions', updated: '2026-05-22', body: 'Demo note: review OOP, dependency injection, async/await, REST endpoints and database basics.', checklist: [{ id: 1, text: 'Dependency injection', done: true }, { id: 2, text: 'async/await', done: false }, { id: 3, text: 'REST API basics', done: false }] }
];

const inspirationCards = [
  { title: 'Stay consistent', text: 'Small steps every day lead to big changes.', image: publicAsset('assets/bed-coffe.jpg') },
  { title: 'Slow progress counts', text: 'One thoughtful application is still progress.', image: publicAsset('assets/cofee-photo2.webp') },
  { title: 'Keep it soft', text: 'You do not need chaos to move forward.', image: publicAsset('assets/candle-vanilla.jpg') },
  { title: 'Tiny wins matter', text: 'A saved offer, a sent CV, a follow-up — all count.', image: publicAsset('assets/croissant-bow.jpg') },
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
  { id: 'notes', label: 'Notes', icon: StickyNote }
];

const pageLabels: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Here’s an overview of your recruitment progress.' },
  applications: { title: 'Applications', subtitle: 'Manage your job applications and recruitment stages.' },
  companies: { title: 'Companies', subtitle: 'Track companies, previous applications and recruitment history.' },
  statistics: { title: 'Statistics', subtitle: 'Analyze your application progress and discover what works best.' },
  calendar: { title: 'Calendar', subtitle: 'Plan interviews, follow-ups and recruitment tasks.' },
  documents: { title: 'Documents', subtitle: 'Manage CV versions, cover letters and application files.' },
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

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
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
  return `${formatter.format(start)} – ${formatter.format(end)}`;
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
      setError('Podaj poprawny e-mail i hasło minimum 4 znaki.');
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
        <div className="login-copy"><span className="eyebrow">Live demo</span><h1>Track applications without chaos.</h1><p>Mockup działa lokalnie w przeglądarce: możesz dodawać, edytować, filtrować i zapisywać dane w localStorage.</p></div>
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
  function openSettings(tab: ProfileTab) {
    setOpen(false);
    onOpenSettings(tab);
  }
  return (
    <header className={`topbar ${isDashboard ? '' : 'actions-only'}`}>
      {isDashboard ? <div className="topbar-title"><h1>Good morning, {firstName}</h1><p>Here’s an overview of your recruitment progress.</p></div> : <div className="topbar-spacer" />}
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
  return <section className="panel-card upcoming-card"><div className="mini-title"><CalendarDays size={17} /><h2>Upcoming</h2></div>{upcoming.map((event) => <div className="event-row" key={event.id}><span className="event-icon"><CalendarDays size={15} /></span><div><strong>{event.title} — {event.company}</strong><small>{formatDate(event.date)}, {event.time}</small></div></div>)}<button className="mini-link with-arrow" type="button" onClick={onOpenCalendar}>View calendar <ChevronDown className="chevron-right" size={16} /></button></section>;
}

function ApplicationsTable({ applications, compact = false, selectedId, onSelect, onStatusChange, onDelete, onEdit }: { applications: JobApplication[]; compact?: boolean; selectedId?: number; onSelect?: (application: JobApplication) => void; onStatusChange?: (id: number, status: Status) => void; onDelete?: (id: number) => void; onEdit?: (application: JobApplication) => void }) {
  return (
    <div className="table-wrap custom-scroll">
      <table className={`applications-table ${compact ? 'compact-table' : ''}`}>
        <thead><tr><th>Company</th><th>Position</th>{!compact ? <th>Category</th> : null}<th>Status</th><th>Date applied</th>{!compact ? <th>Work mode</th> : null}{!compact ? <th>Last contact</th> : null}<th>Next step</th>{!compact ? <th aria-label="Actions" /> : null}</tr></thead>
        <tbody>
          {applications.map((app) => <tr key={app.id} className={selectedId === app.id ? 'selected-row' : ''} onClick={() => onSelect?.(app)}><td><div className="company-cell"><CompanyLogo name={app.company} domain={app.domain} /><div><strong>{app.company}</strong>{!compact ? <small><MapPin size={12} /> {app.location}</small> : null}</div></div></td><td><div className="position-cell"><strong>{app.position}</strong>{!compact ? <small>{app.level}</small> : null}</div></td>{!compact ? <td><CategoryPill category={app.category} /></td> : null}<td>{onStatusChange && !compact ? <div onClick={(e) => e.stopPropagation()}><CustomSelect value={app.status} options={statuses} onChange={(value) => onStatusChange(app.id, value as Status)} className="status-custom-select" /></div> : <StatusBadge status={app.status} />}</td><td>{formatDate(app.dateApplied)}</td>{!compact ? <td>{app.workMode}</td> : null}{!compact ? <td>{formatDate(app.lastContact)}</td> : null}<td>{app.nextStep}</td>{!compact ? <td className="row-actions"><button className="ghost-icon" type="button" aria-label="Edit" onClick={(event) => { event.stopPropagation(); onEdit?.(app); }}><Pencil size={17} /></button><button className="ghost-icon" type="button" aria-label="Open offer" onClick={(event) => { event.stopPropagation(); if (app.offerUrl) window.open(app.offerUrl, '_blank'); }}><ExternalLink size={17} /></button><button className="ghost-icon danger" type="button" aria-label="Delete" onClick={(event) => { event.stopPropagation(); onDelete?.(app.id); }}><Trash2 size={17} /></button></td> : null}</tr>)}
        </tbody>
      </table>
      {!applications.length ? <div className="empty-state"><Folder size={28} /><strong>No results</strong><span>Try changing filters or add a new application.</span></div> : null}
    </div>
  );
}

function ApplicationsPage({ applications, onOpenApplication, onOpenEditApplication, onStatusChange, onDelete, selectedApplication, setSelectedApplication, onExport, categoryOptions, levelOptions }: { applications: JobApplication[]; onOpenApplication: () => void; onOpenEditApplication: (app: JobApplication) => void; onStatusChange: (id: number, status: Status) => void; onDelete: (id: number) => void; selectedApplication: JobApplication | null; setSelectedApplication: (application: JobApplication | null) => void; onExport: () => void; categoryOptions: string[]; levelOptions: string[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [location, setLocation] = useState('All');
  const [mode, setMode] = useState('All');
  const [source, setSource] = useState('All');
  const locations = useMemo(() => ['All', ...Array.from(new Set(applications.map((app) => app.location))).filter(Boolean)], [applications]);
  const filtered = useMemo(() => applications.filter((app) => {
    const search = `${app.company} ${app.position} ${app.category} ${app.source} ${app.location}`.toLowerCase();
    return search.includes(query.toLowerCase()) && (status === 'All' || app.status === status) && (category === 'All' || app.category === category) && (level === 'All' || app.level === level) && (location === 'All' || app.location === location) && (mode === 'All' || app.workMode === mode) && (source === 'All' || app.source === source);
  }), [applications, query, status, category, level, location, mode, source]);
  useEffect(() => {
    if (!filtered.length) setSelectedApplication(null);
    else if (!selectedApplication || !filtered.some((app) => app.id === selectedApplication.id)) setSelectedApplication(filtered[0]);
  }, [filtered, selectedApplication, setSelectedApplication]);
  const hasFilters = query || status !== 'All' || category !== 'All' || level !== 'All' || location !== 'All' || mode !== 'All' || source !== 'All';
  return <section className="page-section"><div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search company, position..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><CustomSelect label="Status" value={status} options={['All', ...statuses]} onChange={setStatus} /><CustomSelect label="Category" value={category} options={['All', ...categoryOptions]} onChange={setCategory} /><CustomSelect label="Level" value={level} options={['All', ...levelOptions]} onChange={setLevel} /><CustomSelect label="Location" value={location} options={locations} onChange={setLocation} /><CustomSelect label="Work mode" value={mode} options={['All', ...workModes]} onChange={setMode} /><CustomSelect label="Source" value={source} options={['All', ...sources]} onChange={setSource} /><button className="secondary-button" type="button" onClick={onExport}><Download size={17} /> Export</button>{hasFilters ? <button className="secondary-button" type="button" onClick={() => { setQuery(''); setStatus('All'); setCategory('All'); setLevel('All'); setLocation('All'); setMode('All'); setSource('All'); }}>Clear</button> : null}</div><section className="panel-card applications-panel"><ApplicationsTable applications={filtered} selectedId={selectedApplication?.id} onSelect={setSelectedApplication} onStatusChange={onStatusChange} onDelete={onDelete} onEdit={onOpenEditApplication} /></section>{selectedApplication ? <section className="panel-card details-panel"><ApplicationDetails application={selectedApplication} onEdit={() => onOpenEditApplication(selectedApplication)} /></section> : null}</section>;
}

function ApplicationDetails({ application, onEdit }: { application: JobApplication; onEdit: () => void }) {
  return <div className="details-grid"><div><div className="details-heading"><CompanyLogo name={application.company} domain={application.domain} large /><div><h2>{application.company}</h2><p>{application.position}</p></div><StatusBadge status={application.status} /></div><div className="details-actions"><button className="secondary-button" type="button" onClick={() => application.offerUrl && window.open(application.offerUrl, '_blank')}><ExternalLink size={17} /> Open offer</button><button className="secondary-button" type="button" onClick={onEdit}><Pencil size={17} /> Edit</button></div></div><div className="details-lists"><InfoList title="Requirements" text={application.requirements} /><InfoList title="Benefits" text={application.benefits} /><InfoList title="Details" text={`${application.location}, ${application.workMode}, ${application.source}, ${application.cv}`} /></div><div className="timeline-card"><h3>Recruitment timeline</h3>{['Saved offer', 'CV sent', application.lastContact ? 'Company response' : 'Waiting', application.nextStep].map((item, index) => <div className="timeline-row" key={`${item}-${index}`}><span /><div><strong>{item}</strong><small>{index === 0 ? formatDate(application.dateApplied) : index === 1 ? formatDate(application.dateApplied) : index === 2 ? formatDate(application.lastContact) : 'Next step'}</small></div></div>)}</div></div>;
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
                <button className="ghost-icon calendar-nav-button" type="button" onClick={() => setMonthDate(addMonths(monthDate, -1))} aria-label="Previous month">‹</button>
                <button className="secondary-button today-button" type="button" onClick={() => setMonthDate(startOfMonth(today()))}>Today</button>
                <button className="ghost-icon calendar-nav-button" type="button" onClick={() => setMonthDate(addMonths(monthDate, 1))} aria-label="Next month">›</button>
              </div>
            </div>
            <div className="calendar-grid-head">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid-days">{monthCells.map((cell) => { const dayEvents = sorted.filter((event) => event.date === cell.iso); return <button className={`calendar-day ${dayEvents.length ? 'has-event' : ''} ${!cell.isCurrentMonth ? 'muted-day' : ''}`} type="button" key={cell.iso} onClick={() => dayEvents[0] ? setModal(dayEvents[0]) : newEvent(cell.iso)}><span>{cell.day}</span>{dayEvents.slice(0, 2).map((event) => <small key={event.id}>{event.title}</small>)}</button>; })}</div>
          </section>
        ) : view === 'Week' ? (
          <section className="panel-card calendar-card week-calendar">
            <div className="calendar-header-row">
              <div><h2>Week view</h2><p>{formatWeekRange(weekStart)}</p></div>
              <div className="calendar-nav-controls"><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">‹</button><button className="secondary-button today-button" type="button" onClick={() => setWeekStart(startOfWeek(today()))}>Today</button><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">›</button></div>
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
  return <div className={`event-card ${compact ? 'compact-event' : ''}`}><span className="event-icon"><Clock size={16} /></span><div><strong>{event.title}</strong><p>{event.company}</p><small>{formatDate(event.date)}, {event.time} · {event.location}</small></div><div className="event-card-actions"><button className="ghost-icon" type="button" onClick={onEdit}><Pencil size={16} /></button><button className="ghost-icon danger" type="button" onClick={onDelete}><Trash2 size={16} /></button></div>{event.type.includes('interview') ? <Video size={16} /> : <Mail size={16} />}</div>;
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
  return <section className="page-section"><div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search documents..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><CustomSelect label="Type" value={type} options={['All', ...documentTypes]} onChange={setType} /><button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}><Upload size={17} /> Upload</button><input ref={fileInput} type="file" hidden onChange={(e) => upload(e.target.files)} /><button className="secondary-button" type="button" onClick={() => setLinkModal(true)}><LinkIcon size={17} /> Add link</button><button className="secondary-button" type="button" onClick={onExport}><Download size={17} /> Export CSV</button></div><div className="document-grid">{filtered.map((doc) => <article className="panel-card document-card" key={doc.id}><div className="document-icon"><FileText size={24} /></div><div><h2>{doc.name}</h2><p>{doc.type} · {doc.category}</p></div><div className="document-meta"><span>Updated {formatDate(doc.updated)}</span><span>Used in {doc.usedIn} applications</span><span>{doc.size}</span></div><div className="document-actions"><button className="ghost-icon" type="button" onClick={() => doc.url && window.open(doc.url, '_blank')}><Eye size={17} /></button><button className="ghost-icon" type="button" onClick={() => setToast('Preview/download is mocked for local files.')}><Download size={17} /></button><button className="ghost-icon danger" type="button" onClick={() => remove(doc.id)}><Trash2 size={17} /></button></div></article>)}</div><section className="panel-card insight-strip"><Sparkles size={18} /><span>Most used CV: <strong>CV_NET_Intern_2026.pdf</strong></span><span>Best response rate: <strong>CV_Cybersecurity_IAM_2026.pdf</strong></span></section>{linkModal ? <DocumentLinkModal onClose={() => setLinkModal(false)} onSave={addLink} /> : null}</section>;
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
  return <section className="page-section"><div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search notes..." /></div><button className="primary-button" type="button" onClick={addNote}><Plus size={17} /> Add note</button></div><div className="notes-layout"><aside className="notes-list panel-card custom-scroll">{notes.map((note) => <button key={note.id} className={`note-card ${selected?.id === note.id ? 'selected' : ''}`} type="button" onClick={() => setSelectedId(note.id)}><strong>{note.title}</strong><span>{note.company} · {note.tag}</span><small>{formatDate(note.updated)}</small></button>)}</aside>{selected ? <section className="panel-card note-editor"><div className="note-editor-head"><TextField label="Title" value={selected.title} onChange={(v) => patchNote({ title: v })} /><button className="ghost-icon danger" type="button" onClick={() => deleteNote(selected.id)}><Trash2 size={18} /></button></div><div className="form-grid"><TextField label="Company" value={selected.company} onChange={(v) => patchNote({ company: v })} /><TextField label="Application" value={selected.application} onChange={(v) => patchNote({ application: v })} /><TextField label="Tag" value={selected.tag} onChange={(v) => patchNote({ tag: v })} /></div><label className="form-field full-field"><span>Note body</span><textarea value={selected.body} onChange={(event) => patchNote({ body: event.target.value })} /></label><div className="checklist-panel"><div className="checklist-header"><h3>Checklist</h3><button className="secondary-button small" type="button" onClick={addChecklistItem}><Plus size={15} /> Add item</button></div>{selected.checklist.map((item) => <div className="checklist-row" key={item.id}><button className={`check-box ${item.done ? 'checked' : ''}`} type="button" onClick={() => updateChecklist(item.id, { done: !item.done })}>{item.done ? <Check size={14} /> : null}</button><input value={item.text} onChange={(event) => updateChecklist(item.id, { text: event.target.value })} /><button className="ghost-icon danger" type="button" onClick={() => deleteChecklist(item.id)}><Trash2 size={15} /></button></div>)}</div><div className="note-save-hint"><CheckCircle2 size={16} /> Changes are saved automatically in this mockup.</div></section> : <section className="panel-card empty-state"><StickyNote size={28} /><strong>No note selected</strong><span>Add a note to start writing.</span></section>}</div></section>;
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
  return <div className="tab-content"><div className="profile-photo-row"><span className={`profile-photo avatar-variant-${avatarVariant}`}>{avatarVariant === 2 ? getInitials(profile.name) : <User size={31} />}</span><div><h3>Profile photo</h3><p>Mock avatar variant: {avatarLabels[avatarVariant]}.</p><button className="text-button strong" type="button" onClick={() => setAvatarVariant((avatarVariant + 1) % avatarLabels.length)}>Change avatar</button></div></div><div className="form-grid"><TextField label="Full name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} /><TextField label="Email address" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} /><TextField label="Job search title" value={profile.title} onChange={(v) => setProfile({ ...profile, title: v })} /><TextField label="Preferred location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} /><div className="form-field"><span>Preferred work mode</span><CustomSelect value={profile.workMode} options={workModes} onChange={(v) => setProfile({ ...profile, workMode: v as WorkMode })} /></div></div></div>;
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
  const [newLocation, setNewLocation] = useState('');
  function patch(patchValue: Partial<AppSettings['preferences']>) { setSettings({ ...settings, preferences: { ...prefs, ...patchValue } }); }
  function toggleString(key: 'categories' | 'levels' | 'locations', value: string) { const current = prefs[key]; patch({ [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] } as Partial<AppSettings['preferences']>); }
  function toggleMode(mode: WorkMode) { patch({ workModes: prefs.workModes.includes(mode) ? prefs.workModes.filter((item) => item !== mode) : [...prefs.workModes, mode] }); }
  function addCustom(key: 'categories' | 'levels' | 'locations', value: string, clear: (value: string) => void) {
    const clean = value.trim();
    if (!clean) return;
    const current = prefs[key];
    if (!current.includes(clean)) patch({ [key]: [...current, clean] } as Partial<AppSettings['preferences']>);
    clear('');
  }
  const categoryItems = uniqueOptions(categories, prefs.categories);
  const levelItems = uniqueOptions(levels, prefs.levels);
  const locationItems = uniqueOptions(['Remote', 'Warsaw', 'Kraków', 'Wrocław', 'Gdańsk'], prefs.locations);
  return <div className="tab-content"><PreferenceGroup title="Preferred categories" items={categoryItems} selected={prefs.categories} onToggle={(value) => toggleString('categories', value)} addValue={newCategory} setAddValue={setNewCategory} onAdd={() => addCustom('categories', newCategory, setNewCategory)} addPlaceholder="Add custom category" /><PreferenceGroup title="Preferred job levels" items={levelItems} selected={prefs.levels} onToggle={(value) => toggleString('levels', value)} addValue={newLevel} setAddValue={setNewLevel} onAdd={() => addCustom('levels', newLevel, setNewLevel)} addPlaceholder="Add custom level" /><PreferenceGroup title="Preferred locations" items={locationItems} selected={prefs.locations} onToggle={(value) => toggleString('locations', value)} addValue={newLocation} setAddValue={setNewLocation} onAdd={() => addCustom('locations', newLocation, setNewLocation)} addPlaceholder="Add custom location" /><PreferenceGroup title="Preferred work modes" items={workModes} selected={prefs.workModes} onToggle={(value) => toggleMode(value as WorkMode)} /><div className="rules-grid"><TextField label="Mark as no response after" value={String(prefs.noResponseDays)} onChange={(v) => patch({ noResponseDays: Number(v) || 0 })} /><TextField label="Mark as ghosted after" value={String(prefs.ghostedDays)} onChange={(v) => patch({ ghostedDays: Number(v) || 0 })} /><TextField label="Suggest follow-up after" value={String(prefs.followUpDays)} onChange={(v) => patch({ followUpDays: Number(v) || 0 })} /></div></div>;
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

function App() {
  const [isLoggedIn, setLoggedIn] = useState(() => readStorage(STORAGE.session, false));
  const [profile, setProfile] = useState<Profile>(() => readStorage(STORAGE.profile, initialProfile));
  const [settings, setSettings] = useState<AppSettings>(() => readStorage(STORAGE.settings, initialSettings));
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
  function updateStatus(id: number, status: Status) { const next = applications.map((app) => app.id === id ? { ...app, status, lastContact: app.lastContact || today() } : app); setApplications(next); setSelectedApplication(next.find((app) => app.id === id) || null); setToast('Status updated.'); }
  function deleteApplication(id: number) { setApplications(applications.filter((app) => app.id !== id)); if (selectedApplication?.id === id) setSelectedApplication(null); setToast('Application removed.'); }
  function resetDemo() { if (!confirm('Reset all demo data?')) return; setApplications(initialApplications); setCompanies(initialCompanies); setEvents(initialEvents); setDocuments(initialDocuments); setNotes(initialNotes); setSettings(initialSettings); setProfile(initialProfile); setToast('Demo data reset.'); }
  function backup() { downloadJson('trackmycv-backup.json', { profile, settings, applications, companies, events, documents, notes }, setToast); }
  const shellClass = `app-shell ${theme === 'dark' ? 'dark' : ''} density-${settings.density.toLowerCase()} accent-${settings.accent.toLowerCase().replaceAll(' ', '-')}`;
  const categoryOptions = uniqueOptions(categories, settings.preferences.categories);
  const levelOptions = uniqueOptions(levels, settings.preferences.levels);

  if (!isLoggedIn) return <LoginPage onLogin={login} />;

  return <div className={shellClass}><Sidebar page={page} setPage={setPage} applications={applications} settings={settings} /><div className="workspace"><Topbar page={page} profile={profile} theme={theme} setTheme={setTheme} onOpenApplication={() => setEditingApplication(null)} onOpenSettings={openSettings} onLogout={logout} setPage={setPage} /><div className="content custom-scroll">{page !== 'dashboard' ? <PageHeader page={page} /> : null}{page === 'dashboard' ? <DashboardPage applications={applications} events={events} setPage={setPage} /> : null}{page === 'applications' ? <ApplicationsPage applications={applications} onOpenApplication={() => setEditingApplication(null)} onOpenEditApplication={(app) => setEditingApplication(app)} onStatusChange={updateStatus} onDelete={deleteApplication} selectedApplication={selectedApplication} setSelectedApplication={setSelectedApplication} onExport={() => exportCsv(applications, setToast)} categoryOptions={categoryOptions} levelOptions={levelOptions} /> : null}{page === 'companies' ? <CompaniesPage companies={companies} applications={applications} setCompanies={setCompanies} setToast={setToast} /> : null}{page === 'statistics' ? <StatisticsPage applications={applications} categoryOptions={categoryOptions} /> : null}{page === 'calendar' ? <CalendarPage events={events} applications={applications} setEvents={setEvents} setToast={setToast} /> : null}{page === 'documents' ? <DocumentsPage documents={documents} setDocuments={setDocuments} onExport={() => exportCsv(applications, setToast)} setToast={setToast} /> : null}{page === 'notes' ? <NotesPage notes={notes} setNotes={setNotes} setToast={setToast} /> : null}</div></div>{settingsOpen ? <ProfileCustomizationModal profile={profile} setProfile={setProfile} settings={settings} setSettings={setSettings} activeTab={settingsTab} setActiveTab={setSettingsTab} theme={theme} setTheme={setTheme} onClose={() => setSettingsOpen(false)} onExport={() => exportCsv(applications, setToast)} onBackup={backup} onReset={resetDemo} /> : null}{editingApplication !== undefined ? <ApplicationModal application={editingApplication || undefined} companies={companies} documents={documents} categoryOptions={categoryOptions} levelOptions={levelOptions} onClose={() => setEditingApplication(undefined)} onSave={saveApplication} /> : null}{toast ? <Toast message={toast} /> : null}</div>;
}

export default App;

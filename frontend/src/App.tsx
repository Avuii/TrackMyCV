import { type CSSProperties, type Dispatch, FormEvent, type MouseEvent as ReactMouseEvent, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Coffee,
  Copy,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flag,
  Folder,
  Globe,
  Heart,
  LayoutDashboard,
  List as ListIcon,
  Link as LinkIcon,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Paperclip,
  Pencil,
  PhoneCall,
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
import { useApplications } from './features/applications/hooks/useApplications';
import { useDocuments } from './features/documents/hooks/useDocuments';
import { authApi, type AuthUser, type LoginInput, type RegisterInput } from './api/authApi';
import { clearAuthToken, getAuthToken } from './api/apiClient';
import type { ApplicationUpsertInput } from './api/applicationsApi';
import { documentsApi, type StoredDocument } from './api/documentsApi';
import { aiApi, type CoverLetterGenerateResponse, type CvReviewDto, type CvReviewRequest } from './api/aiApi';
import { calendarEventsApi, type CalendarEventDto, type CalendarEventRequest } from './api/calendarEventsApi';
import { notificationsApi, type NotificationSettingsDto, type NotificationSettingsRequest } from './api/notificationsApi';
import type { ApplicationStatus as ApiApplicationStatus, JobApplication as ApiJobApplication } from './types';

type Page = 'dashboard' | 'applications' | 'companies' | 'statistics' | 'calendar' | 'documents' | 'notes' | 'ai';
type Theme = 'light' | 'dark' | 'system';
type Status = 'Saved' | 'Applied' | 'In progress' | 'Interview' | 'Task / test' | 'Offer' | 'Rejected' | 'No response' | 'Ghosted' | 'Archived';
type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
type CalendarView = 'Month' | 'Week' | 'Day';
type ProfileTab = 'profile' | 'appearance' | 'notifications' | 'preferences' | 'data';
type DocKind = 'CV' | 'Cover letter' | 'Portfolio' | 'GitHub' | 'LinkedIn' | 'Job offer' | 'Task description' | 'Recruiter email' | 'Certificate' | 'Other';
type EntityId = string | number;
type AvatarVariant = 'neutral' | 'round' | 'initials';

type JobApplication = {
  id: EntityId;
  company: string;
  companyId?: EntityId | null;
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
  applicationId?: EntityId;
  date: string;
  time: string;
  endTime?: string;
  type: string;
  location: string;
  meetingLink: string;
  notes: string;
  icon?: string;
  color?: string;
};

type DocumentItem = {
  id: EntityId;
  name: string;
  type: DocKind;
  category: string;
  updated: string;
  usedIn: number;
  size: string;
  url: string;
  language?: string;
  targetRole?: string;
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
  usedInApplicationsCount?: number;
  assignedApplications?: EntityId[];
  tags?: string[];
  status?: 'Active' | 'Archived';
  notes?: string;
  successRate?: number;
  lastUsedAt?: string;
  isDefault?: boolean;
};

type ChecklistItem = {
  id: number;
  text: string;
  done: boolean;
};

type NoteAttachment = {
  id: number;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  addedAt: string;
};

type NoteItem = {
  id: number;
  title: string;
  company: string;
  application: string;
  tag: string;
  tags?: string[];
  type?: string;
  updated: string;
  lastEdited?: string;
  preview?: string;
  body: string;
  pinned?: boolean;
  favorite?: boolean;
  attachments?: NoteAttachment[];
  checklist: ChecklistItem[];
};

type Profile = {
  name: string;
  email: string;
  title: string;
  location: string;
  workMode: WorkMode;
  avatarVariant: AvatarVariant;
  avatarImage: string;
};

type AppSettings = {
  showMotivation: boolean;
  animations: boolean;
  density: 'Comfortable' | 'Compact';
  accent: 'Taupe' | 'Champagne' | 'Dusty rose' | 'Soft brown' | 'Beige';
  notifications: {
    email: string;
    emailConfigured: boolean;
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
  session: 'trackmycv.session.v4',
  profile: 'trackmycv.profile.v4',
  applications: 'trackmycv.applications.v4',
  companies: 'trackmycv.companies.v4',
  events: 'trackmycv.events.v4',
  documents: 'trackmycv.documents.v4',
  notes: 'trackmycv.notes.v4',
  settings: 'trackmycv.settings.v4',
  theme: 'trackmycv.theme.v4'
};

const statuses: Status[] = ['Saved', 'Applied', 'In progress', 'Interview', 'Task / test', 'Offer', 'Rejected', 'No response', 'Ghosted', 'Archived'];
const categories = ['.NET', 'C#', 'Cybersecurity', 'IAM', 'SOC', 'DevOps', 'React', 'Full-stack', 'Backend', 'Frontend', 'Data / AI', 'Support IT', 'Other'];
const levels = ['Internship', 'Intern', 'Trainee', 'Working Student', 'Junior', 'Junior-friendly', 'Mid', 'Senior'];
const workModes: WorkMode[] = ['Remote', 'Hybrid', 'On-site'];
const sources = ['LinkedIn', 'Just Join IT', 'No Fluff Jobs', 'Pracuj.pl', 'Company website', 'Company career page', 'Referral', 'Direct referral', 'Recruiter message', 'Other'];
const eventTypes = ['HR interview', 'Technical interview', 'Recruitment task', 'Online test', 'Follow-up reminder', 'Application deadline', 'Company research', 'CV update reminder'];
const eventIconOptions = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'phone', label: 'Phone', icon: PhoneCall },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'briefcase', label: 'Work', icon: BriefcaseBusiness },
  { id: 'message', label: 'Message', icon: MessageCircle },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'flag', label: 'Deadline', icon: Flag },
  { id: 'alert', label: 'Important', icon: AlertCircle }
];

const eventIconMap: Record<string, typeof CalendarDays> = {
  calendar: CalendarDays,
  video: Video,
  email: Mail,
  mail: Mail,
  phone: PhoneCall,
  code: Code2,
  interview: BriefcaseBusiness,
  briefcase: BriefcaseBusiness,
  message: MessageCircle,
  coffee: Coffee,
  followUp: Flag,
  flag: Flag,
  reminder: AlertCircle,
  alert: AlertCircle
};

const eventColorOptions = [
  { id: 'taupe', label: 'Taupe', value: '#9a7658' },
  { id: 'rose', label: 'Rose', value: '#ca7374' },
  { id: 'blue', label: 'Blue', value: '#5f8faf' },
  { id: 'green', label: 'Green', value: '#6d8b63' },
  { id: 'gold', label: 'Gold', value: '#c69260' },
  { id: 'violet', label: 'Violet', value: '#8c75b8' }
];
const industries = ['Technology', 'Consulting', 'Software house', 'E-commerce', 'Banking', 'Cybersecurity', 'Other'];
const documentTypes: DocKind[] = ['CV', 'Cover letter', 'Portfolio', 'GitHub', 'LinkedIn', 'Job offer', 'Task description', 'Recruiter email', 'Certificate', 'Other'];
const avatarVariants: { id: AvatarVariant; label: string }[] = [
  { id: 'neutral', label: 'Classic' },
  { id: 'round', label: 'Round' },
  { id: 'initials', label: 'Initials' }
];
const avatarVariantClasses: Record<AvatarVariant, string> = {
  neutral: 'avatar-variant-0',
  round: 'avatar-variant-1',
  initials: 'avatar-variant-2'
};
const avatarImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxAvatarImageBytes = 2 * 1024 * 1024;

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
  name: 'User',
  email: '',
  title: '',
  location: '',
  workMode: 'Hybrid',
  avatarVariant: 'initials',
  avatarImage: ''
};

const profileFromAuthUser = (user: AuthUser): Profile => ({
  ...initialProfile,
  name: user.displayName || user.email.split('@')[0],
  email: user.email
});

const initialSettings: AppSettings = {
  showMotivation: true,
  animations: true,
  density: 'Comfortable',
  accent: 'Taupe',
  notifications: {
    email: '',
    emailConfigured: false,
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
const initialTheme: Theme = 'system';

const textEncodingFixes: [string, string][] = [
  ['\u004b\u0072\u0061\u006b\u0102\u0142\u0077', 'Kraków'],
  ['\u004b\u0072\u0061\u006b\u00c4\u201a\u0139\u201a\u0077', 'Kraków'],
  ['\u0057\u0072\u006f\u0063\u0139\u201a\u0061\u0077', 'Wrocław'],
  ['\u0047\u0064\u0061\u0139\u201e\u0073\u006b', 'Gdańsk'],
  ['\u00c2\u00b7', '·'],
  ['\u00e2\u20ac\u201d', '-'],
  ['\u00e2\u20ac\u201c', '-'],
  ['\u00e2\u20ac\u2122', "'"],
  ['\u0102\u02d8\u00e2\u201a\u00ac\u00e2\u20ac\u0165', '-'],
  ['\u0102\u02d8\u00e2\u201a\u00ac\u00e2\u20ac\u015b', '-'],
  ['\u0102\u02d8\u00e2\u201a\u00ac\u00e2\u201e\u02d8', "'"]
];

const repairTextEncoding = (value: string) =>
  textEncodingFixes.reduce((text, [broken, fixed]) => text.replaceAll(broken, fixed), value);

function repairStoredText<T>(value: T): T {
  if (typeof value === 'string') {
    return repairTextEncoding(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairStoredText(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairStoredText(item)])) as T;
  }

  return value;
}

const normalizeAppSettings = (value?: Partial<AppSettings> | null): AppSettings => {
  const normalized = {
    ...initialSettings,
    ...(value ?? {}),
    notifications: {
      ...initialSettings.notifications,
      ...(value?.notifications ?? {})
    },
    preferences: {
      ...initialSettings.preferences,
      ...(value?.preferences ?? {})
    }
  };

  return repairStoredText(normalized);
};

const toListText = (value: string | string[] | null | undefined) => Array.isArray(value) ? value.join(', ') : value || '';

const normalizeStatus = (status: string): Status => {
  if (statuses.includes(status as Status)) return status as Status;
  if (status === 'HR interview' || status === 'Technical interview') return 'Interview';
  if (status === 'Confirmation received') return 'In progress';
  if (status === 'Withdrawn') return 'Archived';
  return 'Saved';
};

const normalizeWorkMode = (mode: string): WorkMode => workModes.includes(mode as WorkMode) ? mode as WorkMode : 'Remote';

const normalizeDocumentType = (type: string): DocKind => documentTypes.includes(type as DocKind) ? type as DocKind : 'Other';

const splitTextList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const apiApplicationToUi = (application: ApiJobApplication): JobApplication => {
  const cleanApplication = repairStoredText(application);

  return {
    id: cleanApplication.id,
    company: cleanApplication.company,
    companyId: cleanApplication.companyId,
    domain: safeDomain(cleanApplication.company),
    position: cleanApplication.position,
    category: cleanApplication.category || 'Other',
    level: cleanApplication.level || 'Internship',
    status: normalizeStatus(cleanApplication.status),
    dateApplied: cleanApplication.dateApplied,
    lastContact: cleanApplication.lastContact === '-' ? '' : cleanApplication.lastContact,
    nextStep: cleanApplication.nextStep,
    location: cleanApplication.location,
    workMode: normalizeWorkMode(cleanApplication.workMode),
    source: cleanApplication.source,
    offerUrl: cleanApplication.offerUrl,
    requirements: toListText(cleanApplication.requirements),
    benefits: toListText(cleanApplication.benefits),
    notes: cleanApplication.notes,
    cv: cleanApplication.cv
  };
};

const apiDocumentToUi = (document: StoredDocument): DocumentItem => {
  const cleanDocument = repairStoredText(document);

  return {
    id: cleanDocument.id,
    name: cleanDocument.name,
    type: normalizeDocumentType(cleanDocument.type),
    category: cleanDocument.category || 'General',
    updated: cleanDocument.updated,
    usedIn: cleanDocument.usedIn ?? cleanDocument.usedInApplicationsCount ?? 0,
    size: cleanDocument.size,
    url: cleanDocument.url || '',
    language: cleanDocument.language || undefined,
    targetRole: cleanDocument.targetRole || undefined,
    fileName: cleanDocument.fileName || undefined,
    createdAt: cleanDocument.createdAt,
    updatedAt: cleanDocument.updatedAt,
    usedInApplicationsCount: cleanDocument.usedInApplicationsCount ?? cleanDocument.usedIn ?? 0,
    assignedApplications: cleanDocument.assignedApplications ?? [],
    tags: cleanDocument.tags ?? [],
    status: cleanDocument.status === 'Archived' ? 'Archived' : 'Active',
    notes: cleanDocument.notes || undefined,
    successRate: cleanDocument.successRate ?? 0,
    lastUsedAt: cleanDocument.lastUsedAt || undefined,
    isDefault: cleanDocument.isDefault ?? false
  };
};

const uiApplicationToApi = (application: JobApplication): ApplicationUpsertInput => ({
  companyId: application.companyId === undefined || application.companyId === null ? null : String(application.companyId),
  company: application.company,
  position: application.position,
  category: application.category,
  level: application.level,
  status: application.status as ApiApplicationStatus,
  dateApplied: application.dateApplied,
  lastContact: application.lastContact,
  nextStep: application.nextStep,
  location: application.location,
  workMode: application.workMode,
  source: application.source,
  requirements: splitTextList(application.requirements),
  benefits: splitTextList(application.benefits),
  notes: application.notes,
  offerUrl: application.offerUrl,
  cv: application.cv
});

const applyNotificationSettingsDto = (settings: AppSettings, dto: NotificationSettingsDto): AppSettings => ({
  ...settings,
  notifications: {
    ...settings.notifications,
    email: dto.email,
    emailConfigured: dto.emailConfigured,
    interviews: dto.interviewReminders,
    followUps: dto.followUpReminders,
    deadlines: dto.applicationDeadlines,
    weekly: dto.weeklySummary,
    monthly: dto.monthlyReport,
    reminderTime: dto.reminderTime
  }
});

const notificationSettingsToApi = (settings: AppSettings, profile: Profile): NotificationSettingsRequest => ({
  email: settings.notifications.email || profile.email,
  interviewReminders: settings.notifications.interviews,
  followUpReminders: settings.notifications.followUps,
  applicationDeadlines: settings.notifications.deadlines,
  weeklySummary: settings.notifications.weekly,
  monthlyReport: settings.notifications.monthly,
  reminderTime: settings.notifications.reminderTime
});

const apiTime = (time?: string) => `${minutesToTime(timeToMinutes(time))}:00`;

const uiTime = (time?: string | null) => time ? minutesToTime(timeToMinutes(time.slice(0, 5))) : undefined;

const calendarEventFromApi = (event: CalendarEventDto): CalendarEvent => normalizeCalendarEvent({
  id: Number(event.clientEventId) || makeId(),
  title: event.title,
  company: event.company,
  applicationId: event.applicationId || undefined,
  date: event.eventDate,
  time: uiTime(event.startTime) || '10:00',
  endTime: uiTime(event.endTime) || addMinutesToTime(uiTime(event.startTime) || '10:00', 60),
  type: event.eventType,
  location: event.location,
  meetingLink: event.meetingLink,
  notes: event.detailedPlan,
  icon: event.icon,
  color: event.color
});

const calendarEventToApi = (event: CalendarEvent): CalendarEventRequest => {
  const normalized = normalizeCalendarEvent(event);

  return {
    clientEventId: String(normalized.id),
    title: normalized.title || 'Untitled event',
    company: normalized.company || 'General',
    applicationId: normalized.applicationId === undefined || normalized.applicationId === null ? '' : String(normalized.applicationId),
    eventType: normalized.type || 'Calendar event',
    eventDate: normalized.date,
    startTime: apiTime(normalized.time),
    endTime: normalized.endTime ? apiTime(normalized.endTime) : null,
    location: normalized.location || '',
    meetingLink: normalized.meetingLink || '',
    detailedPlan: normalized.notes || '',
    icon: normalized.icon || DEFAULT_EVENT_ICON,
    color: getEventColor(normalized.color)
  };
};

const appInitialCompanies: Company[] = [];
const appInitialApplications: JobApplication[] = [];
const appInitialEvents: CalendarEvent[] = [];
const appInitialDocuments: DocumentItem[] = [];
const appInitialNotes: NoteItem[] = [];
const maxNoteAttachmentBytes = 5 * 1024 * 1024;
const markdownNoteSnippet = [
  '## Section title',
  '',
  '- First item',
  '- Second item',
  '',
  '**Important:** add details here.'
].join('\n');
const codeNoteSnippet = [
  '```ts',
  '// Paste code here',
  'const nextStep = "follow-up";',
  '```'
].join('\n');
const mermaidNoteSnippet = [
  '```mermaid',
  'flowchart TD',
  '  A[Application sent] --> B{Response?}',
  '  B -->|Yes| C[Interview]',
  '  B -->|No| D[Follow-up]',
  '```'
].join('\n');

const inspirationCards = [
  { title: 'Stay consistent', text: 'Small steps every day lead to big changes.', image: publicAsset('assets/bed-coffe.jpg') },
  { title: 'Slow progress counts', text: 'One thoughtful application is still progress.', image: publicAsset('assets/cofee-photo2.webp') },
  { title: 'Keep it soft', text: 'You do not need chaos to move forward.', image: publicAsset('assets/candle-vanilla.jpg') },
  { title: 'Tiny wins matter', text: 'A saved offer, a sent CV, a follow-up - all count.', image: publicAsset('assets/croissant-bow.jpg') },
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
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'ai', label: 'AI Tools', icon: Sparkles }
];

const pageLabels: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: "Here's an overview of your recruitment progress." },
  applications: { title: 'Applications', subtitle: 'Manage your job applications and recruitment stages.' },
  companies: { title: 'Companies', subtitle: 'Track companies, previous applications and recruitment history.' },
  statistics: { title: 'Statistics', subtitle: 'Analyze your application progress and discover what works best.' },
  calendar: { title: 'Calendar', subtitle: 'Plan interviews, follow-ups and recruitment tasks.' },
  documents: { title: 'Documents', subtitle: 'Manage CV versions, cover letters and application files.' },
  notes: { title: 'Notes', subtitle: 'Keep recruitment notes, interview questions and company research in one place.' },
  ai: { title: 'AI Tools', subtitle: 'Review CVs and generate cover letters from your saved documents.' }
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? repairStoredText(JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key: string) {
  localStorage.removeItem(key);
}

const workspaceStorageKeys = [
  STORAGE.profile,
  STORAGE.settings,
  STORAGE.applications,
  STORAGE.companies,
  STORAGE.events,
  STORAGE.documents,
  STORAGE.notes,
  STORAGE.theme
];

function userStorageKey(userId: string, key: string) {
  return `${key}.user.${userId}`;
}

function readUserStorage<T>(userId: string, key: string, fallback: T): T {
  return readStorage(userStorageKey(userId, key), fallback);
}

function writeUserStorage<T>(userId: string, key: string, value: T) {
  writeStorage(userStorageKey(userId, key), value);
}

function clearSharedWorkspaceStorage() {
  workspaceStorageKeys.forEach(removeStorage);
}

function formatDate(value: string) {
  if (!value) return '-';
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
  return [formatter.format(start), formatter.format(end)].join(' - ');
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

const dayHours = Array.from({ length: 24 }, (_, hour) => hour);
const DAY_HOUR_HEIGHT = 64;
const DEFAULT_EVENT_ICON = eventIconOptions[0].id;
const DEFAULT_EVENT_COLOR = eventColorOptions[0].value;

type EventCssStyle = CSSProperties & {
  '--event-color': string;
  '--event-bg'?: string;
  '--event-border'?: string;
  '--event-icon-color'?: string;
};

type EventColorStyles = {
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function timeToMinutes(time?: string) {
  const [rawHours, rawMinutes] = (time || '00:00').split(':');
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return clamp((hours * 60) + minutes, 0, 1439);
}

function minutesToTime(value: number) {
  const minutes = clamp(Math.round(value), 0, 1439);
  const hoursPart = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minutesPart = String(minutes % 60).padStart(2, '0');
  return `${hoursPart}:${minutesPart}`;
}

function addMinutesToTime(time: string | undefined, minutes: number) {
  return minutesToTime(timeToMinutes(time || '10:00') + minutes);
}

function isHexColor(color?: string) {
  return /^#[0-9a-f]{6}$/i.test(color || '');
}

function hexToRgba(color: string, alpha: number) {
  const normalized = isHexColor(color) ? color : DEFAULT_EVENT_COLOR;
  const value = normalized.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getEventColor(color?: string) {
  const option = eventColorOptions.find((item) => item.value === color || item.id === color);
  if (option) return option.value;
  return isHexColor(color) ? color as string : DEFAULT_EVENT_COLOR;
}

function getEventColorStyles(color?: string): EventColorStyles {
  const accentColor = getEventColor(color);

  return {
    accentColor,
    backgroundColor: hexToRgba(accentColor, 0.13),
    borderColor: hexToRgba(accentColor, 0.36),
    iconColor: accentColor
  };
}

function getEventIconComponent(icon?: string) {
  return icon ? eventIconMap[icon] || CalendarDays : CalendarDays;
}

function normalizeCalendarEvent(event: CalendarEvent): CalendarEvent {
  const start = timeToMinutes(event.time || '10:00');
  const rawEnd = event.endTime ? timeToMinutes(event.endTime) : start + 60;
  const end = clamp(rawEnd <= start ? start + 60 : rawEnd, start + 15, 1439);

  return {
    ...event,
    date: event.date || today(),
    time: minutesToTime(start),
    endTime: minutesToTime(end),
    icon: event.icon || DEFAULT_EVENT_ICON,
    color: getEventColor(event.color)
  };
}

function getEventRange(event: CalendarEvent) {
  const normalized = normalizeCalendarEvent(event);
  const start = timeToMinutes(normalized.time);
  const end = Math.max(start + 15, timeToMinutes(normalized.endTime));
  return { start, end: clamp(end, start + 15, 1439) };
}

function formatEventTime(event: CalendarEvent) {
  const normalized = normalizeCalendarEvent(event);
  return `${normalized.time} - ${normalized.endTime}`;
}

function eventColorStyle(event: CalendarEvent): EventCssStyle {
  const colors = getEventColorStyles(event.color);

  return {
    '--event-color': colors.accentColor,
    '--event-bg': colors.backgroundColor,
    '--event-border': colors.borderColor,
    '--event-icon-color': colors.iconColor
  };
}

function getDayEventLayouts(events: CalendarEvent[]) {
  const prepared = events.map(normalizeCalendarEvent)
    .map((event) => ({ event, ...getEventRange(event), column: 0, columnCount: 1 }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const layouts: Array<typeof prepared[number] & { top: number; height: number; left: number; width: number }> = [];

  function flush(cluster: typeof prepared) {
    if (!cluster.length) return;

    const columnEnds: number[] = [];
    cluster.forEach((item) => {
      const column = columnEnds.findIndex((end) => end <= item.start);
      item.column = column === -1 ? columnEnds.length : column;
      columnEnds[item.column] = item.end;
    });

    const columnCount = Math.max(1, columnEnds.length);
    cluster.forEach((item) => {
      const top = (item.start / 60) * DAY_HOUR_HEIGHT;
      const height = Math.max(((item.end - item.start) / 60) * DAY_HOUR_HEIGHT, 34);
      layouts.push({
        ...item,
        columnCount,
        top,
        height,
        left: (item.column / columnCount) * 100,
        width: 100 / columnCount
      });
    });
  }

  let cluster: typeof prepared = [];
  let clusterEnd = -1;

  prepared.forEach((item) => {
    if (!cluster.length || item.start < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
      return;
    }

    flush(cluster);
    cluster = [item];
    clusterEnd = item.end;
  });

  flush(cluster);
  return layouts;
}

function isSameIsoDay(date: string, compare: Date) {
  return date === toIsoDate(compare);
}

function getCurrentMinutes(date = new Date()) {
  return (date.getHours() * 60) + date.getMinutes();
}

function EventIcon({ icon, size = 16 }: { icon?: string; size?: number }) {
  const Icon = getEventIconComponent(icon);
  return <Icon size={size} />;
}

function CurrentTimeIndicator({ date }: { date: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!isSameIsoDay(date, now)) {
    return null;
  }

  const minutes = getCurrentMinutes(now);
  const top = (minutes / 60) * DAY_HOUR_HEIGHT;

  return (
    <div className="current-time-indicator" style={{ top }} aria-label={`Current time ${minutesToTime(minutes)}`}>
      <span className="current-time-dot" />
      <span className="current-time-label">{minutesToTime(minutes)}</span>
      <span className="current-time-line" />
    </div>
  );
}

type CalendarEventCardVariant = 'month' | 'week' | 'day' | 'upcoming' | 'mobile';

function CalendarEventCard({
  event,
  variant,
  onEdit,
  onDelete,
  style
}: {
  event: CalendarEvent;
  variant: CalendarEventCardVariant;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: CSSProperties;
}) {
  const normalized = normalizeCalendarEvent(event);
  const colorStyle = eventColorStyle(normalized);
  const mergedStyle = { ...colorStyle, ...style } as EventCssStyle;
  const location = normalized.location || 'Online';
  const meta = [normalized.company, location].filter(Boolean).join(' · ');
  const open = (clickEvent: ReactMouseEvent) => {
    clickEvent.stopPropagation();
    onEdit?.();
  };

  if (variant === 'month') {
    return (
      <button className="calendar-event-card month-event-card" type="button" title={normalized.title || 'Untitled event'} style={mergedStyle} onClick={open}>
        <span className="calendar-event-glyph"><EventIcon icon={normalized.icon} size={12} /></span>
        <span className="calendar-event-time">{normalized.time}</span>
        <strong>{normalized.title || 'Untitled event'}</strong>
      </button>
    );
  }

  if (variant === 'week') {
    return (
      <button className="calendar-event-card week-event-block" type="button" title={normalized.title || 'Untitled event'} style={mergedStyle} onClick={open}>
        <span className="calendar-event-header"><EventIcon icon={normalized.icon} size={13} /> {formatEventTime(normalized)}</span>
        <strong>{normalized.title || 'Untitled event'}</strong>
        <small>{meta}</small>
      </button>
    );
  }

  if (variant === 'day') {
    return (
      <button className="calendar-event-card day-event-block" type="button" title={normalized.title || 'Untitled event'} style={mergedStyle} onClick={open}>
        <span className="day-event-icon"><EventIcon icon={normalized.icon} size={14} /></span>
        <span className="day-event-time">{formatEventTime(normalized)}</span>
        <strong>{normalized.title || 'Untitled event'}</strong>
        <small>{meta}</small>
      </button>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className="mobile-calendar-event calendar-event-card" style={mergedStyle}>
        <button type="button" onClick={open}>
          <span className="mobile-calendar-icon"><EventIcon icon={normalized.icon} size={15} /></span>
          <div><strong>{normalized.title || 'Untitled event'}</strong><small>{formatEventTime(normalized)} · {meta}</small></div>
        </button>
        <button className="ghost-icon" type="button" onClick={onEdit}><Pencil size={16} /></button>
        <button className="ghost-icon danger" type="button" onClick={onDelete}><Trash2 size={16} /></button>
      </div>
    );
  }

  return (
    <article className="event-card compact-event calendar-event-card" style={mergedStyle}>
      <span className="event-icon"><EventIcon icon={normalized.icon} size={17} /></span>
      <div className="event-card-content">
        <strong title={normalized.title || 'Untitled event'}>{normalized.title || 'Untitled event'}</strong>
        <p>{formatDate(normalized.date)}, {formatEventTime(normalized)}</p>
        <small>{meta || 'Online'}</small>
      </div>
      <div className="event-card-actions">
        <button className="ghost-icon" type="button" onClick={onEdit} aria-label="Edit event"><Pencil size={16} /></button>
        <button className="ghost-icon danger" type="button" onClick={onDelete} aria-label="Delete event"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function normalizeAvatarVariant(value?: string): AvatarVariant {
  return avatarVariants.some((variant) => variant.id === value) ? (value as AvatarVariant) : 'initials';
}

function normalizeTheme(value?: string): Theme {
  return value === 'dark' || value === 'system' ? value : 'light';
}

function ProfileAvatar({ profile, className = '', iconSize = 18 }: { profile: Profile; className?: string; iconSize?: number }) {
  const variant = normalizeAvatarVariant(profile.avatarVariant);
  const variantClass = avatarVariantClasses[variant] || avatarVariantClasses.initials;
  const initials = getInitials(profile.name);
  const content = profile.avatarImage ? <img src={profile.avatarImage} alt="" /> : variant === 'initials' ? initials : <User size={iconSize} />;

  return (
    <span className={`profile-avatar ${variantClass} ${profile.avatarImage ? 'has-image' : ''} ${className}`} aria-label="Profile avatar">
      {content}
    </span>
  );
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
  const responseTimes = applications
    .map((app) => {
      if (!app.dateApplied || !app.lastContact) return null;

      const appliedAt = new Date(`${app.dateApplied}T00:00:00`);
      const contactedAt = new Date(`${app.lastContact}T00:00:00`);

      if (Number.isNaN(appliedAt.getTime()) || Number.isNaN(contactedAt.getTime())) return null;

      return Math.max(0, Math.round((contactedAt.getTime() - appliedAt.getTime()) / 86_400_000));
    })
    .filter((days): days is number => days !== null);
  const responseRate = total ? Math.round((response / total) * 100) : 0;
  const successRate = total ? Math.round((positive / total) * 100) : 0;
  const averageResponseDays = responseTimes.length ? Math.round(responseTimes.reduce((sum, days) => sum + days, 0) / responseTimes.length) : 0;
  return { total, active, interviews, positive, responseRate, successRate, averageResponseDays };
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
  if (!applications.length) {
    setToast('Add your first application before exporting CSV.');
    return;
  }

  const header = ['Company', 'Position', 'Category', 'Level', 'Status', 'Date applied', 'Last contact', 'Next step', 'Location', 'Work mode', 'Source', 'Offer URL'];
  const rows = applications.map((app) => [app.company, app.position, app.category, app.level, app.status, app.dateApplied, app.lastContact, app.nextStep, app.location, app.workMode, app.source, app.offerUrl]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trackmycv-applications.csv';
  link.click();
  URL.revokeObjectURL(url);
  setToast('CSV exported.');
}

function detectCsvDelimiter(input: string) {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') index += 1;
      else inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) break;
    if (!inQuotes && char === ',') commas += 1;
    if (!inQuotes && char === ';') semicolons += 1;
  }

  return semicolons > commas ? ';' : ',';
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const input = repairTextEncoding(text.replace(/^\uFEFF/, ''));
  const delimiter = detectCsvDelimiter(input);

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }

      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

const normalizeCsvHeader = (value: string) =>
  repairTextEncoding(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ą]/g, 'a')
    .replace(/[ć]/g, 'c')
    .replace(/[ę]/g, 'e')
    .replace(/[ł]/g, 'l')
    .replace(/[ń]/g, 'n')
    .replace(/[ó]/g, 'o')
    .replace(/[ś]/g, 's')
    .replace(/[źż]/g, 'z')
    .replace(/[^a-z0-9]/g, '');

function csvIndex(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeCsvHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeCsvHeader(header)));
}

function csvValue(row: string[], indexes: Record<string, number>, key: string) {
  const index = indexes[key];
  return index === undefined || index < 0 ? '' : repairTextEncoding(row[index] ?? '').trim();
}

function parseCsvDate(value: string, fallback = '') {
  const clean = value.trim();
  if (!clean) return fallback;

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  const match = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) {
    throw new Error(`Unsupported date format: ${clean}. Use YYYY-MM-DD or DD.MM.YYYY.`);
  }

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function normalizeImportedStatus(value: string): Status {
  const clean = repairTextEncoding(value).trim();
  if (statuses.includes(clean as Status)) return clean as Status;

  const normalized = normalizeCsvHeader(clean);
  const aliases: Record<string, Status> = {
    saved: 'Saved',
    zapisane: 'Saved',
    applied: 'Applied',
    wyslane: 'Applied',
    sent: 'Applied',
    inprogress: 'In progress',
    wtoku: 'In progress',
    interview: 'Interview',
    rozmowa: 'Interview',
    tasktest: 'Task / test',
    taskortest: 'Task / test',
    zadanie: 'Task / test',
    test: 'Task / test',
    offer: 'Offer',
    oferta: 'Offer',
    rejected: 'Rejected',
    odrzucone: 'Rejected',
    noresponse: 'No response',
    brakodpowiedzi: 'No response',
    ghosted: 'Ghosted',
    archived: 'Archived',
    archiwum: 'Archived'
  };

  return aliases[normalized] ?? 'Applied';
}

function normalizeImportedWorkMode(value: string): WorkMode {
  const clean = repairTextEncoding(value).trim();
  if (workModes.includes(clean as WorkMode)) return clean as WorkMode;

  const normalized = normalizeCsvHeader(clean);
  const aliases: Record<string, WorkMode> = {
    remote: 'Remote',
    zdalnie: 'Remote',
    hybrid: 'Hybrid',
    hybrydowo: 'Hybrid',
    onsite: 'On-site',
    onside: 'On-site',
    stacjonarnie: 'On-site',
    office: 'On-site'
  };

  return aliases[normalized] ?? 'Remote';
}

function parseApplicationsCsv(text: string): JobApplication[] {
  const rows = parseCsv(text);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0];
  const indexes = {
    company: csvIndex(headers, ['Company', 'Company name', 'Firma']),
    position: csvIndex(headers, ['Position', 'Role', 'Stanowisko']),
    category: csvIndex(headers, ['Category', 'Kategoria']),
    level: csvIndex(headers, ['Level', 'Poziom']),
    status: csvIndex(headers, ['Status']),
    dateApplied: csvIndex(headers, ['Date applied', 'Applied at', 'Data aplikacji']),
    lastContact: csvIndex(headers, ['Last contact', 'Ostatni kontakt']),
    nextStep: csvIndex(headers, ['Next step', 'Następny krok']),
    location: csvIndex(headers, ['Location', 'Lokalizacja']),
    workMode: csvIndex(headers, ['Work mode', 'Tryb pracy']),
    source: csvIndex(headers, ['Source', 'Źródło', 'Zrodlo']),
    offerUrl: csvIndex(headers, ['Offer URL', 'Offer link', 'URL', 'Link']),
    requirements: csvIndex(headers, ['Requirements', 'Wymagania']),
    benefits: csvIndex(headers, ['Benefits', 'Benefity']),
    notes: csvIndex(headers, ['Notes', 'Notatki']),
    cv: csvIndex(headers, ['CV', 'CV version', 'CV name'])
  };

  if (indexes.company < 0 || indexes.position < 0) {
    throw new Error('CSV must include Company and Position columns.');
  }

  return rows.slice(1).map((row, rowIndex) => {
    const company = csvValue(row, indexes, 'company');
    const position = csvValue(row, indexes, 'position');

    if (!company || !position) {
      throw new Error(`Row ${rowIndex + 2}: Company and Position are required.`);
    }

    const dateApplied = parseCsvDate(csvValue(row, indexes, 'dateApplied'), today());
    const lastContact = parseCsvDate(csvValue(row, indexes, 'lastContact'));

    return {
      id: makeId(),
      company,
      companyId: null,
      domain: safeDomain(company),
      position,
      category: csvValue(row, indexes, 'category') || 'Other',
      level: csvValue(row, indexes, 'level') || 'Junior',
      status: normalizeImportedStatus(csvValue(row, indexes, 'status')),
      dateApplied,
      lastContact,
      nextStep: csvValue(row, indexes, 'nextStep') || 'Waiting',
      location: csvValue(row, indexes, 'location') || 'Remote',
      workMode: normalizeImportedWorkMode(csvValue(row, indexes, 'workMode')),
      source: csvValue(row, indexes, 'source') || 'Other',
      offerUrl: csvValue(row, indexes, 'offerUrl'),
      requirements: csvValue(row, indexes, 'requirements'),
      benefits: csvValue(row, indexes, 'benefits'),
      notes: csvValue(row, indexes, 'notes'),
      cv: csvValue(row, indexes, 'cv')
    };
  });
}

function readTextFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('CSV file could not be read.'));
    reader.readAsText(file, 'utf-8');
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`${file.name} could not be loaded.`));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function downloadJson(filename: string, data: unknown, setToast: (value: string) => void) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
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
  const cleanDomain = domain?.trim();

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
    <span className={`company-logo initials-logo ${large ? 'large' : ''}`} aria-label={`${name} logo`}>
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

const passwordRules = [
  { id: 'length', label: 'Minimum 8 characters', test: (value: string) => value.length >= 8 },
  { id: 'lowercase', label: 'Lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { id: 'uppercase', label: 'Uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'number', label: 'Number', test: (value: string) => /\d/.test(value) },
  { id: 'special', label: 'Special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) }
];

function getPasswordRuleStates(password: string) {
  return passwordRules.map((rule) => ({ ...rule, met: rule.test(password) }));
}

function PasswordRequirements({ password }: { password: string }) {
  const ruleStates = useMemo(() => getPasswordRuleStates(password), [password]);

  return (
    <div className="password-requirements" aria-live="polite">
      <strong>Password needs:</strong>
      <div className="password-rule-grid">
        {ruleStates.map((rule) => (
          <span key={rule.id} className={rule.met ? 'met' : ''}>
            {rule.met ? <Check size={13} /> : <X size={13} />}
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoginPage({ onLogin, onRegister, resolvedTheme }: { onLogin: (input: LoginInput) => Promise<void>; onRegister: (input: RegisterInput) => Promise<void>; resolvedTheme: 'light' | 'dark' }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (!cleanEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Enter your password.');
      return;
    }

    if (mode === 'register') {
      const failedRule = getPasswordRuleStates(password).find((rule) => !rule.met);

      if (failedRule) {
        setError('Password must include minimum 8 characters, uppercase and lowercase letters, a number and a special character.');
        return;
      }
    }

    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await onRegister({ email: cleanEmail, password, displayName: cleanDisplayName });
      } else {
        await onLogin({ email: cleanEmail, password });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className={`login-page ${resolvedTheme === 'dark' ? 'dark' : ''} ${mode === 'register' ? 'register-mode' : 'login-mode'}`}>
      <section className="login-card">
        <Logo />
        <div className="login-copy"><span className="eyebrow">Private workspace</span><h1>Track applications without chaos.</h1><p>Create your account, upload your CV, save applications and keep recruitment notes in one place.</p></div>
        <form className="login-form" onSubmit={submit}>
          <div className="segmented-row auth-mode-switch">
            <button className={mode === 'login' ? 'selected' : ''} type="button" onClick={() => { setMode('login'); setError(''); }}>Log in</button>
            <button className={mode === 'register' ? 'selected' : ''} type="button" onClick={() => { setMode('register'); setError(''); }}>Register</button>
          </div>
          {mode === 'register' ? <label>Name<input value={displayName} placeholder="Anna" autoComplete="name" onChange={(event) => { setDisplayName(event.target.value); setError(''); }} /></label> : null}
          <label>Email<input type="email" value={email} placeholder="example@mail.com" autoComplete="email" onChange={(event) => { setEmail(event.target.value); setError(''); }} /></label>
          <label>Password<input type="password" value={password} placeholder="........" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} onChange={(event) => { setPassword(event.target.value); setError(''); }} /></label>
          {mode === 'register' ? <PasswordRequirements password={password} /> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button full" type="submit" disabled={submitting}>{submitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Log in'}</button>
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
    <aside className={`sidebar custom-scroll ${settings.showMotivation ? 'with-motivation' : 'without-motivation'}`}>
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

function Topbar({ page, profile, resolvedTheme, setTheme, onOpenApplication, onOpenSettings, onLogout, setPage }: { page: Page; profile: Profile; resolvedTheme: 'light' | 'dark'; setTheme: (theme: Theme) => void; onOpenApplication: () => void; onOpenSettings: (tab?: ProfileTab) => void; onLogout: () => void; setPage: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const isDashboard = page === 'dashboard';
  const firstName = profile.name.split(' ')[0] || 'User';
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
        <button className="icon-button" type="button" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>{resolvedTheme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button>
        <div className="profile-wrap">
          <button className={`profile-button ${open ? 'open' : ''}`} type="button" onClick={() => setOpen((v) => !v)}><ProfileAvatar profile={profile} className="avatar-soft" iconSize={18} /><span>{firstName}</span><ChevronDown size={16} className={open ? 'rotated' : ''} /></button>
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

  if (!applications.length) {
    return (
      <section className="page-section">
        <div className="panel-card empty-state app-empty-state">
          <BriefcaseBusiness size={30} />
          <strong>Your tracker is ready</strong>
          <span>Add your first job application, then upload the CV version you used for it.</span>
          <div className="empty-state-actions">
            <button className="primary-button" type="button" onClick={() => setPage('applications')}><Plus size={17} /> Add application</button>
            <button className="secondary-button" type="button" onClick={() => setPage('documents')}><Upload size={17} /> Upload CV</button>
          </div>
        </div>
      </section>
    );
  }

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
  return <section className="panel-card upcoming-card"><div className="mini-title"><CalendarDays size={17} /><h2>Upcoming</h2></div>{upcoming.map((event) => <div className="event-row" key={event.id}><span className="event-icon"><CalendarDays size={15} /></span><div><strong>{event.title} - {event.company}</strong><small>{formatDate(event.date)}, {event.time}</small></div></div>)}<button className="mini-link with-arrow" type="button" onClick={onOpenCalendar}>View calendar <ChevronDown className="chevron-right" size={16} /></button></section>;
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
  selectedId?: EntityId;
  onSelect?: (application: JobApplication) => void;
  onStatusChange?: (id: EntityId, status: Status) => void;
  onDelete?: (id: EntityId) => void;
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
  onStatusChange: (id: EntityId, status: Status) => void;
  onDelete: (id: EntityId) => void;
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

      {!applications.length ? (
        <div className="panel-card empty-state app-empty-state">
          <BriefcaseBusiness size={30} />
          <strong>No applications yet</strong>
          <span>Add your first application to start tracking companies, stages and CV usage.</span>
          <button className="primary-button" type="button" onClick={onOpenApplication}><Plus size={17} /> Add application</button>
        </div>
      ) : viewMode === 'list' ? (
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
  onStatusChange: (id: EntityId, status: Status) => void;
  onDelete: (id: EntityId) => void;
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
      subtitle={`${application.company} · ${application.position}`}
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
  return <BaseModal title={form.id ? 'Edit company' : 'Add company'} subtitle="Save company details for recruitment history." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid"><TextField label="Company name" value={form.name} onChange={(v) => set('name', v)} placeholder="Example Company" /><TextField label="Domain" value={form.domain} onChange={(v) => set('domain', v)} placeholder="company.com" /><div className="form-field"><span>Industry</span><CustomSelect value={form.industry} options={industries} onChange={(v) => set('industry', v)} /></div><TextField label="Location" value={form.location} onChange={(v) => set('location', v)} /><TextField label="Website" value={form.website} onChange={(v) => set('website', v)} /><TextField label="Contact" value={form.contact} onChange={(v) => set('contact', v)} /></div><TextAreaField label="Notes" value={form.notes} onChange={(v) => set('notes', v)} /><ModalFooter onClose={onClose} submitLabel="Save company" /></form></BaseModal>;
}

function StatisticsPage({ applications, categoryOptions }: { applications: JobApplication[]; categoryOptions: string[] }) {
  const [range, setRange] = useState('All time');
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState('All');
  const scoped = applications.filter((app) => (category === 'All' || app.category === category) && (mode === 'All' || app.workMode === mode));
  const stats = calculateStats(scoped);
  return <section className="page-section"><div className="toolbar compact-toolbar"><CustomSelect label="Range" value={range} options={['Last 7 days', 'Last 30 days', 'This month', 'All time']} onChange={setRange} /><CustomSelect label="Category" value={category} options={['All', ...categoryOptions]} onChange={setCategory} /><CustomSelect label="Work mode" value={mode} options={['All', ...workModes]} onChange={setMode} /></div><div className="stats-metrics-grid"><MetricCard label="Total applications" value={stats.total} hint={range} /><MetricCard label="Active processes" value={stats.active} hint="currently open" /><MetricCard label="Response rate" value={`${stats.responseRate}%`} hint="from selected" tone="green-text" /><MetricCard label="Interview rate" value={`${stats.successRate}%`} hint="positive stages" tone="blue-text" /><MetricCard label="Ghosted" value={scoped.filter((app) => app.status === 'Ghosted').length} hint="to archive" /><MetricCard label="Avg response time" value={`${stats.averageResponseDays}d`} hint="first contact" /></div><div className="stats-grid"><section className="panel-card chart-panel wide-chart"><div className="mini-title"><BarChart3 size={18} /><h2>Applications by category</h2></div><BarList rows={topRows(scoped.map((app) => app.category))} /></section><ApplicationSummary applications={scoped} /><section className="panel-card chart-panel"><div className="mini-title"><Sparkles size={18} /><h2>Applications by level</h2></div><BarList rows={topRows(scoped.map((app) => app.level))} /></section><MiniListCard icon={Globe} title="Best sources" rows={topRows(scoped.map((app) => app.source))} /></div></section>;
}

function BarList({ rows }: { rows: [string, string][] }) {
  const max = Math.max(...rows.map(([, value]) => Number(value)), 1);
  return <div className="bar-chart-list">{rows.map(([label, value]) => <div className="bar-row" key={label}><span>{label}</span><div><span style={{ width: `${(Number(value) / max) * 100}%` }} /></div><strong>{value}</strong></div>)}</div>;
}

function CalendarPage({ events, applications, setEvents, setToast, onSyncNotificationEvent, onDeleteNotificationEvent }: { events: CalendarEvent[]; applications: JobApplication[]; setEvents: (events: CalendarEvent[]) => void; setToast: (value: string) => void; onSyncNotificationEvent?: (event: CalendarEvent) => void; onDeleteNotificationEvent?: (id: number) => void }) {
  const [view, setView] = useState<CalendarView>('Month');
  const [modal, setModal] = useState<CalendarEvent | null>(null);
  const dayScheduleRef = useRef<HTMLDivElement | null>(null);
  const sorted = events.map(normalizeCalendarEvent).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  const [dayDate, setDayDate] = useState(() => toDate(today()));
  const [monthDate, setMonthDate] = useState(() => startOfMonth(today()));
  const monthCells = getMonthCells(monthDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const selectedDayIso = toIsoDate(dayDate);
  const selectedDayEvents = sorted.filter((event) => event.date === selectedDayIso);
  const dayLayouts = getDayEventLayouts(selectedDayEvents);
  const dayTimelineHeight = DAY_HOUR_HEIGHT * 24;
  const nowMinutes = getCurrentMinutes();
  const upcomingEvents = sorted.filter((event) => `${event.date}${event.time}` >= `${today()}${minutesToTime(nowMinutes)}`).slice(0, 5);

  useEffect(() => {
    if (view !== 'Day' || selectedDayIso !== today()) return;

    const scrollTarget = Math.max(0, (getCurrentMinutes() / 60) * DAY_HOUR_HEIGHT - 150);
    dayScheduleRef.current?.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, [view, selectedDayIso]);

  function save(event: CalendarEvent) {
    const normalized = normalizeCalendarEvent(event);
    if (events.some((item) => item.id === normalized.id)) setEvents(events.map((item) => item.id === normalized.id ? normalized : item));
    else setEvents([normalized, ...events]);
    setModal(null);
    setToast('Calendar event saved.');
    onSyncNotificationEvent?.(normalized);
  }
  function remove(id: number) { setEvents(events.filter((event) => event.id !== id)); setToast('Calendar event removed.'); onDeleteNotificationEvent?.(id); }
  function newEvent(date = today(), time = '10:00') {
    setModal({ id: 0, title: '', company: applications[0]?.company || '', applicationId: applications[0]?.id, date, time, endTime: addMinutesToTime(time, 60), type: 'HR interview', location: 'Online', meetingLink: '', notes: '', icon: DEFAULT_EVENT_ICON, color: DEFAULT_EVENT_COLOR });
  }
  return (
    <section className="page-section">
      <div className="toolbar compact-toolbar">
        <div className="segmented-inline">{(['Month', 'Week', 'Day'] as CalendarView[]).map((item) => <button type="button" className={view === item ? 'selected' : ''} key={item} onClick={() => setView(item)}>{item}</button>)}</div>
        <button className="primary-button" type="button" onClick={() => newEvent(view === 'Day' ? selectedDayIso : today())}><Plus size={17} /> Add event</button>
      </div>
      <div className="calendar-layout">
        {view === 'Month' ? (
          <section className="panel-card calendar-card">
            <div className="calendar-header-row">
              <div><h2>{formatMonthYear(monthDate)}</h2><p>Monthly overview</p></div>
              <div className="calendar-nav-controls">
                <button className="ghost-icon calendar-nav-button" type="button" onClick={() => setMonthDate(addMonths(monthDate, -1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
                <button className="secondary-button today-button" type="button" onClick={() => setMonthDate(startOfMonth(today()))}>Today</button>
                <button className="ghost-icon calendar-nav-button" type="button" onClick={() => setMonthDate(addMonths(monthDate, 1))} aria-label="Next month"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="calendar-grid-head">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid-days">{monthCells.map((cell) => {
              const dayEvents = sorted.filter((event) => event.date === cell.iso);
              const hiddenCount = Math.max(0, dayEvents.length - 3);
              return (
                <div className={`calendar-day ${dayEvents.length ? 'has-event' : ''} ${!cell.isCurrentMonth ? 'muted-day' : ''}`} role="button" tabIndex={0} key={cell.iso} onClick={() => newEvent(cell.iso)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') newEvent(cell.iso); }}>
                  <span className="calendar-day-number">{cell.day}</span>
                  <div className="month-events-stack">
                    {dayEvents.slice(0, 3).map((event) => <CalendarEventCard key={event.id} event={event} variant="month" onEdit={() => setModal(event)} />)}
                    {hiddenCount ? <button className="month-more-events" type="button" onClick={(event) => { event.stopPropagation(); setView('Day'); setDayDate(toDate(cell.iso)); }}>+{hiddenCount} more</button> : null}
                  </div>
                </div>
              );
            })}</div>
          </section>
        ) : view === 'Week' ? (
          <section className="panel-card calendar-card week-calendar">
            <div className="calendar-header-row">
              <div><h2>Week view</h2><p>{formatWeekRange(weekStart)}</p></div>
              <div className="calendar-nav-controls"><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week"><ChevronLeft size={18} /></button><button className="secondary-button today-button" type="button" onClick={() => setWeekStart(startOfWeek(today()))}>Today</button><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week"><ChevronRight size={18} /></button></div>
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
                      {dayEvents.map((event) => <CalendarEventCard key={event.id} event={event} variant="week" onEdit={() => setModal(event)} />)}
                      <button className={`week-add-event ${dayEvents.length ? 'compact' : 'empty'}`} type="button" onClick={() => newEvent(iso)}>
                        <Plus size={14} />
                        <span>Add event</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="panel-card calendar-card day-calendar">
            <div className="calendar-header-row">
              <div><h2>Day view</h2><p>{formatDate(selectedDayIso)}</p></div>
              <div className="calendar-nav-controls"><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setDayDate(addDays(dayDate, -1))} aria-label="Previous day"><ChevronLeft size={18} /></button><button className="secondary-button today-button" type="button" onClick={() => setDayDate(toDate(today()))}>Today</button><button className="ghost-icon calendar-nav-button" type="button" onClick={() => setDayDate(addDays(dayDate, 1))} aria-label="Next day"><ChevronRight size={18} /></button></div>
            </div>
            <div ref={dayScheduleRef} className="day-schedule custom-scroll" style={{ '--day-hour-height': `${DAY_HOUR_HEIGHT}px` } as CSSProperties}>
              <div className="day-time-rail" style={{ height: dayTimelineHeight }}>
                {dayHours.map((hour) => <span className="day-time-label" key={hour}>{minutesToTime(hour * 60)}</span>)}
              </div>
              <div className="day-track" style={{ height: dayTimelineHeight }}>
                {dayHours.map((hour) => <button className="day-hour-button" key={hour} type="button" style={{ top: hour * DAY_HOUR_HEIGHT, height: DAY_HOUR_HEIGHT }} onClick={() => newEvent(selectedDayIso, minutesToTime(hour * 60))}><span>Add plan</span></button>)}
                {!dayLayouts.length ? <div className="day-empty-note">Choose an hour to add your first plan for this day.</div> : null}
                <CurrentTimeIndicator date={selectedDayIso} />
                {dayLayouts.map((layout) => {
                  const style = {
                    top: layout.top,
                    height: layout.height,
                    left: `calc(${layout.left}% + 4px)`,
                    width: `calc(${layout.width}% - 8px)`
                  };
                  return <CalendarEventCard key={layout.event.id} event={layout.event} variant="day" style={style} onEdit={() => setModal(layout.event)} />;
                })}
              </div>
            </div>
          </section>
        )}
        <section className="panel-card event-panel">
          <div className="mini-title"><CalendarDays size={18} /><h2>Upcoming events</h2></div>
          {upcomingEvents.map((event) => <CalendarEventCard key={event.id} event={event} variant="upcoming" onEdit={() => setModal(event)} onDelete={() => remove(event.id)} />)}
          {!upcomingEvents.length ? <p className="empty-panel-note">No upcoming events yet.</p> : null}
        </section>
      </div>
      {modal ? <EventModal event={modal} applications={applications} onClose={() => setModal(null)} onSave={save} /> : null}
    </section>
  );
}

function EventCard({ event, onEdit, onDelete, compact = false }: { event: CalendarEvent; onEdit: () => void; onDelete: () => void; compact?: boolean }) {
  return <CalendarEventCard event={event} variant={compact ? 'upcoming' : 'week'} onEdit={onEdit} onDelete={onDelete} />;
}

function EventModal({ event, applications, onClose, onSave }: { event: CalendarEvent; applications: JobApplication[]; onClose: () => void; onSave: (event: CalendarEvent) => void }) {
  const [form, setForm] = useState(() => normalizeCalendarEvent(event));
  const [error, setError] = useState('');
  function set<K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(e: FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('Add an event title.');
      return;
    }

    if (timeToMinutes(form.endTime) <= timeToMinutes(form.time)) {
      setError('End time must be later than start time.');
      return;
    }

    onSave(normalizeCalendarEvent({ ...form, id: form.id || makeId(), title: form.title.trim() }));
  }
  return (
    <BaseModal title={form.id ? 'Edit event' : 'Add event'} subtitle="Plan interviews, follow-ups and recruitment tasks." onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid">
          <TextField label="Event title" value={form.title} onChange={(v) => { set('title', v); setError(''); }} placeholder="HR interview" />
          <div className="form-field"><span>Company</span><CustomSelect value={form.company || 'General'} options={['General', ...Array.from(new Set(applications.map((app) => app.company)))]} onChange={(v) => set('company', v)} /></div>
          <div className="form-field"><span>Type</span><CustomSelect value={form.type} options={eventTypes} onChange={(v) => set('type', v)} /></div>
          <TextField label="Date" type="date" value={form.date} onChange={(v) => set('date', v)} />
          <TextField label="Start time" type="time" value={form.time} onChange={(v) => { set('time', v); if (timeToMinutes(form.endTime) <= timeToMinutes(v)) set('endTime', addMinutesToTime(v, 60)); setError(''); }} />
          <TextField label="End time" type="time" value={form.endTime || addMinutesToTime(form.time, 60)} onChange={(v) => { set('endTime', v); setError(''); }} />
          <TextField label="Location" value={form.location} onChange={(v) => set('location', v)} />
          <TextField label="Meeting link" value={form.meetingLink} onChange={(v) => set('meetingLink', v)} />
        </div>
        <div className="event-style-grid">
          <div className="setting-group compact-setting">
            <span className="setting-label">Icon</span>
            <div className="event-icon-picker">
              {eventIconOptions.map((option) => {
                const Icon = option.icon;
                return <button key={option.id} className={form.icon === option.id ? 'selected' : ''} type="button" title={option.label} aria-label={option.label} onClick={() => set('icon', option.id)}><Icon size={17} /></button>;
              })}
            </div>
          </div>
          <div className="setting-group compact-setting">
            <span className="setting-label">Color</span>
            <div className="event-color-picker">
              {eventColorOptions.map((option) => <button key={option.id} className={getEventColor(form.color) === option.value ? 'selected' : ''} type="button" title={option.label} aria-label={option.label} style={{ '--event-color': option.value } as EventCssStyle} onClick={() => set('color', option.value)}><span /></button>)}
            </div>
          </div>
        </div>
        <TextAreaField label="Detailed plan" value={form.notes} onChange={(v) => set('notes', v)} placeholder="09:00 intro, 09:20 technical questions, 09:50 next steps" />
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <ModalFooter onClose={onClose} submitLabel="Save event" />
      </form>
    </BaseModal>
  );
}

function LegacyDocumentsPage({ documents, setDocuments, onExport, setToast }: { documents: DocumentItem[]; setDocuments: (docs: DocumentItem[]) => void; onExport: () => void; setToast: (value: string) => void }) {
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
    setToast('Document added.');
  }
  function addLink(doc: DocumentItem) { setDocuments([doc, ...documents]); setLinkModal(false); setToast('Link saved.'); }
  function remove(id: EntityId) { setDocuments(documents.filter((doc) => doc.id !== id)); setToast('Document removed.'); }
  return <section className="page-section"><div className="toolbar"><div className="search-field wide"><Search size={18} /><input placeholder="Search documents..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><CustomSelect label="Type" value={type} options={['All', ...documentTypes]} onChange={setType} /><button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}><Upload size={17} /> Upload</button><input ref={fileInput} type="file" hidden onChange={(e) => upload(e.target.files)} /><button className="secondary-button" type="button" onClick={() => setLinkModal(true)}><LinkIcon size={17} /> Add link</button><button className="secondary-button" type="button" onClick={onExport}><Download size={17} /> Export CSV</button></div><div className="document-grid">{filtered.map((doc) => <article className="panel-card document-card" key={doc.id}><div className="document-icon"><FileText size={24} /></div><div><h2>{doc.name}</h2><p>{doc.type} · {doc.category}</p></div><div className="document-meta"><span>Updated {formatDate(doc.updated)}</span><span>Used in {doc.usedIn} applications</span><span>{doc.size}</span></div><div className="document-actions"><button className="ghost-icon" type="button" onClick={() => doc.url && window.open(doc.url, '_blank')}><Eye size={17} /></button><button className="ghost-icon" type="button" onClick={() => setToast('Preview/download is mocked for local files.')}><Download size={17} /></button><button className="ghost-icon danger" type="button" onClick={() => remove(doc.id)}><Trash2 size={17} /></button></div></article>)}</div><section className="panel-card insight-strip"><Sparkles size={18} /><span>Most used CV: <strong>CV_NET_Intern_2026.pdf</strong></span><span>Best response rate: <strong>CV_Cybersecurity_IAM_2026.pdf</strong></span></section>{linkModal ? <DocumentLinkModal onClose={() => setLinkModal(false)} onSave={addLink} /> : null}</section>;
}

type DocumentsPageProps = {
  documents: DocumentItem[];
  applications: JobApplication[];
  setDocuments: (docs: DocumentItem[]) => void;
  onExport: () => void;
  setToast: (value: string) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onUploadDocument?: (file: File) => Promise<void>;
  onCreateDocumentLink?: (doc: DocumentItem) => Promise<void>;
  onDeleteDocument?: (id: EntityId) => Promise<void>;
  onArchiveDocument?: (id: EntityId) => Promise<void>;
  onDownloadDocument?: (doc: DocumentItem) => Promise<void>;
  onPreviewDocument?: (doc: DocumentItem) => Promise<string>;
};

function DocumentsPage({ documents, applications, setDocuments, onExport, setToast, loading = false, error = null, onRefresh, onUploadDocument, onCreateDocumentLink, onDeleteDocument, onArchiveDocument, onDownloadDocument, onPreviewDocument }: DocumentsPageProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [linkModal, setLinkModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const filtered = documents.filter((doc) => `${doc.name} ${doc.type} ${doc.category} ${doc.tags?.join(' ') ?? ''}`.toLowerCase().includes(query.toLowerCase()) && (type === 'All' || doc.type === type));
  const cvCount = documents.filter((doc) => doc.type === 'CV').length;
  const mostUsedDocument = documents
    .filter((doc) => doc.type === 'CV')
    .sort((first, second) => (second.usedInApplicationsCount ?? second.usedIn) - (first.usedInApplicationsCount ?? first.usedIn))[0];

  useEffect(() => {
    if (!selectedDocument) return;
    setSelectedDocument(documents.find((doc) => doc.id === selectedDocument.id) ?? null);
  }, [documents, selectedDocument?.id]);

  async function upload(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    try {
      if (onUploadDocument) {
        await onUploadDocument(file);
      } else {
        const next: DocumentItem = { id: makeId(), name: file.name, type: file.name.toLowerCase().includes('cv') ? 'CV' : 'Other', category: 'General', updated: today(), usedIn: 0, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, url: '', status: 'Active', tags: [] };
        setDocuments([next, ...documents]);
      }
      setToast('Document added.');
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : 'Document could not be uploaded.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  async function addLink(doc: DocumentItem) {
    try {
      if (onCreateDocumentLink) {
        await onCreateDocumentLink(doc);
      } else {
        setDocuments([{ ...doc, status: 'Active', tags: ['Link'] }, ...documents]);
      }
      setLinkModal(false);
      setToast('Link saved.');
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : 'Link could not be saved.');
    }
  }
  async function remove(id: EntityId) {
    try {
      if (onDeleteDocument) {
        await onDeleteDocument(id);
      } else {
        setDocuments(documents.filter((doc) => doc.id !== id));
      }
      setSelectedDocument(null);
      setToast('Document removed.');
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : 'Document could not be removed.');
    }
  }
  async function archive(id: EntityId) {
    try {
      if (onArchiveDocument) {
        await onArchiveDocument(id);
      } else {
        setDocuments(documents.map((doc) => doc.id === id ? { ...doc, status: 'Archived' } : doc));
        setSelectedDocument((doc) => doc?.id === id ? { ...doc, status: 'Archived' } : doc);
      }
      setToast('Document archived.');
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : 'Document could not be archived.');
    }
  }
  async function download(doc: DocumentItem) {
    try {
      if (doc.url && !doc.fileName) {
        window.open(doc.url, '_blank');
        return;
      }
      if (onDownloadDocument) {
        await onDownloadDocument(doc);
      }
      setToast(`Download started: ${doc.fileName || doc.name}`);
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : 'Document could not be downloaded.');
    }
  }
  async function copyLink(doc: DocumentItem) {
    if (!doc.url) { setToast('This document has no link to copy.'); return; }
    try {
      await navigator.clipboard?.writeText(doc.url);
      setToast('Document link copied.');
    } catch {
      setToast('Could not copy the link. Open it and copy it from the browser.');
    }
  }
  return (
    <section className="page-section">
      <div className="toolbar">
        <div className="search-field wide"><Search size={18} /><input placeholder="Search documents..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <CustomSelect label="Type" value={type} options={['All', ...documentTypes]} onChange={setType} />
        <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()} disabled={loading}><Upload size={17} /> Upload</button>
        <input ref={fileInput} type="file" accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg" hidden onChange={(event) => void upload(event.target.files)} />
        <button className="secondary-button" type="button" onClick={() => setLinkModal(true)}><LinkIcon size={17} /> Add link</button>
        <button className="secondary-button" type="button" onClick={onExport}><Download size={17} /> Export CSV</button>
      </div>
      {loading ? (
        <div className="panel-card empty-state"><FileText size={28} /><strong>Loading documents</strong><span>Connecting to the backend API.</span></div>
      ) : error ? (
        <div className="panel-card empty-state"><FileText size={28} /><strong>Documents API unavailable</strong><span>{error}</span>{onRefresh ? <button className="secondary-button" type="button" onClick={onRefresh}>Refresh</button> : null}</div>
      ) : filtered.length ? (
        <div className="document-grid">
        {filtered.map((doc) => (
          <article className="panel-card document-card" key={doc.id} onClick={() => setSelectedDocument(doc)}>
            <div className="document-icon"><FileText size={24} /></div>
            <div><h2>{doc.name}</h2><p>{doc.type} · {doc.category}</p></div>
            <div className="document-meta"><span>Updated {formatDate(doc.updated)}</span><span>Used in {doc.usedIn} applications</span><span>{doc.status || 'Active'}</span><span>{doc.size}</span></div>
            <div className="document-actions">
              <button className="ghost-icon" type="button" aria-label="Preview document" onClick={(event) => { event.stopPropagation(); setSelectedDocument(doc); }}><Eye size={17} /></button>
              <button className="ghost-icon" type="button" aria-label="Download document" onClick={(event) => { event.stopPropagation(); void download(doc); }}><Download size={17} /></button>
              <button className="ghost-icon danger" type="button" aria-label="Delete document" onClick={(event) => { event.stopPropagation(); void remove(doc.id); }}><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
        </div>
      ) : (
        <div className="panel-card empty-state"><FileText size={28} /><strong>No documents yet</strong><span>Upload your CV or add a portfolio link.</span></div>
      )}
      {documents.length ? (
        <section className="panel-card insight-strip">
          <Sparkles size={18} />
          <span>CV versions: <strong>{cvCount}</strong></span>
          <span>Most used CV: <strong>{mostUsedDocument?.name || 'Not enough data yet'}</strong></span>
        </section>
      ) : null}
      {selectedDocument ? <DocumentDetailsModal document={selectedDocument} applications={applications} onClose={() => setSelectedDocument(null)} onDownload={download} onCopyLink={copyLink} onArchive={archive} onDelete={remove} onPreviewDocument={onPreviewDocument} /> : null}
      {linkModal ? <DocumentLinkModal onClose={() => setLinkModal(false)} onSave={addLink} /> : null}
    </section>
  );
}

function DocumentDetailsModal({
  document,
  applications,
  onClose,
  onDownload,
  onCopyLink,
  onArchive,
  onDelete,
  onPreviewDocument
}: {
  document: DocumentItem;
  applications: JobApplication[];
  onClose: () => void;
  onDownload: (doc: DocumentItem) => void;
  onCopyLink: (doc: DocumentItem) => void;
  onArchive: (id: EntityId) => void;
  onDelete: (id: EntityId) => void;
  onPreviewDocument?: (doc: DocumentItem) => Promise<string>;
}) {
  const assignedApplications = applications.filter((application) => document.assignedApplications?.includes(application.id));
  const isLink = Boolean(document.url);
  const previewFileName = (document.fileName || document.name).toLowerCase();
  const canPreviewPdf = previewFileName.endsWith('.pdf');
  const canPreviewImage = /\.(png|jpe?g)$/i.test(previewFileName);
  const canPreviewInline = canPreviewPdf || canPreviewImage;
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (isLink || !canPreviewInline || !onPreviewDocument) {
      setPreviewUrl('');
      setPreviewLoading(false);
      setPreviewError('');
      return;
    }

    let active = true;
    let objectUrl = '';

    setPreviewUrl('');
    setPreviewError('');
    setPreviewLoading(true);

    onPreviewDocument(document)
      .then((url) => {
        objectUrl = url;
        if (active) {
          setPreviewUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch((requestError) => {
        if (active) {
          setPreviewError(requestError instanceof Error ? requestError.message : 'Document preview could not be loaded.');
        }
      })
      .finally(() => {
        if (active) {
          setPreviewLoading(false);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [canPreviewInline, document.id, isLink]);

  return (
    <BaseModal title={document.name} subtitle={`${document.type} details and preview`} onClose={onClose}>
      <div className="document-details-modal custom-scroll">
        <section className="document-preview-card">
          {isLink ? (
            <div className="url-preview"><LinkIcon size={28} /><strong>{document.url}</strong><span>{document.notes || 'Saved URL preview.'}</span></div>
          ) : previewUrl && canPreviewPdf ? (
            <iframe className="document-preview-frame" src={previewUrl} title={`${document.name} preview`} />
          ) : previewUrl && canPreviewImage ? (
            <img className="document-preview-image" src={previewUrl} alt={`${document.name} preview`} />
          ) : previewLoading ? (
            <div className="pdf-preview"><span>{document.fileName || document.name}</span><i /><i /><i /><i /><strong>Loading preview...</strong></div>
          ) : (
            <div className="pdf-preview"><span>{document.fileName || document.name}</span><i /><i /><i /><i /><strong>{previewError || (canPreviewInline ? 'Preview unavailable. You can still download the file.' : 'This file type can be downloaded for preview.')}</strong></div>
          )}
        </section>
        <section className="document-detail-grid">
          <InfoList title="Metadata" text={[document.type, document.category, document.language, document.targetRole, document.status || 'Active', document.size].filter(Boolean).join(', ')} />
          <InfoList title="Usage" text={`Used in ${document.usedInApplicationsCount ?? document.usedIn} applications. Success rate: ${document.successRate ?? 0}%. Last used: ${document.lastUsedAt || '-'}.`} />
          <InfoList title="Tags" text={(document.tags?.length ? document.tags : ['No tags']).join(', ')} />
          <InfoList title="Notes" text={document.notes || 'No notes yet.'} />
        </section>
        <section className="assigned-applications panel-card">
          <div className="mini-title"><BriefcaseBusiness size={18} /><h2>Assigned applications</h2></div>
          {assignedApplications.length ? assignedApplications.map((application) => (
            <div className="assigned-application-row" key={application.id}>
              <div><strong>{application.company}</strong><span>{application.position}</span></div>
              <StatusBadge status={application.status} />
              <small>{formatDate(application.dateApplied)}</small>
            </div>
          )) : <p>No assigned applications yet.</p>}
        </section>
        <footer className="modal-footer inner">
          {isLink ? <button className="secondary-button" type="button" onClick={() => window.open(document.url, '_blank')}><ExternalLink size={17} /> Open link</button> : null}
          {document.url ? <button className="secondary-button" type="button" onClick={() => onCopyLink(document)}><LinkIcon size={17} /> Copy link</button> : null}
          <button className="secondary-button" type="button" onClick={() => onDownload(document)}><Download size={17} /> Download</button>
          <button className="secondary-button" type="button" onClick={() => onArchive(document.id)}>Archive</button>
          <button className="secondary-button danger-action" type="button" onClick={() => onDelete(document.id)}><Trash2 size={17} /> Delete</button>
        </footer>
      </div>
    </BaseModal>
  );
}

function DocumentLinkModal({ onClose, onSave }: { onClose: () => void; onSave: (doc: DocumentItem) => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<DocKind>('Portfolio');
  const [error, setError] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUrl = url.trim();

    if (!cleanName) {
      setError('Enter a name for this link.');
      return;
    }

    if (!/^https?:\/\/\S+\.\S+/.test(cleanUrl)) {
      setError('Enter a full http or https URL.');
      return;
    }

    setError('');
    onSave({ id: makeId(), name: cleanName, type, category: 'General', updated: today(), usedIn: 0, size: 'URL', url: cleanUrl });
  }
  return <BaseModal title="Add link" subtitle="Save portfolio, GitHub, LinkedIn or another resource." onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="form-grid"><TextField label="Name" value={name} onChange={(value) => { setName(value); setError(''); }} placeholder="Portfolio" /><TextField label="URL" value={url} onChange={(value) => { setUrl(value); setError(''); }} placeholder="https://portfolio.example" /><div className="form-field"><span>Type</span><CustomSelect value={type} options={documentTypes} onChange={(v) => setType(v as DocKind)} /></div></div>{error ? <p className="form-error" role="alert">{error}</p> : null}<ModalFooter onClose={onClose} submitLabel="Save link" /></form></BaseModal>;
}

function renderInlineMarkdown(text: string) {
  const tokens: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let lastIndex = 0;

  text.replace(pattern, (match, _token, offset) => {
    if (offset > lastIndex) tokens.push(text.slice(lastIndex, offset));

    if (match.startsWith('`')) {
      tokens.push(<code key={`${match}-${offset}`}>{match.slice(1, -1)}</code>);
    } else if (match.startsWith('**')) {
      tokens.push(<strong key={`${match}-${offset}`}>{match.slice(2, -2)}</strong>);
    } else {
      const link = match.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      tokens.push(link ? <a key={`${match}-${offset}`} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a> : match);
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
  return tokens.length ? tokens : text;
}

function parseMermaidNode(raw: string) {
  const clean = raw.trim().replace(/;$/, '');
  const match = clean.match(/^([A-Za-z0-9_]+)(?:\[([^\]]+)\]|\(([^)]+)\)|\{([^}]+)\})?$/);
  const id = match?.[1] || clean.replace(/[^A-Za-z0-9_]/g, '') || `node${Math.random().toString(36).slice(2)}`;
  const label = match?.[2] || match?.[3] || match?.[4] || id;
  return { id, label };
}

function parseMermaidDiagram(source: string) {
  const nodes = new Map<string, { id: string; label: string }>();
  const edges: Array<{ from: string; to: string; label?: string }> = [];

  source.split(/\r?\n/).forEach((line) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('%%') || /^(flowchart|graph)\b/i.test(clean)) return;

    const edge = clean.match(/^(.+?)\s*(?:--(?:\|([^|]+)\|)?>|---|==>|-.->)\s*(.+?)\s*;?$/);
    if (!edge) return;

    const from = parseMermaidNode(edge[1]);
    const to = parseMermaidNode(edge[3]);
    nodes.set(from.id, from);
    nodes.set(to.id, to);
    edges.push({ from: from.id, to: to.id, label: edge[2] });
  });

  return { nodes: Array.from(nodes.values()), edges };
}

function MermaidPreview({ source }: { source: string }) {
  const diagram = parseMermaidDiagram(source);

  if (!diagram.nodes.length || !diagram.edges.length) {
    return (
      <pre className="markdown-code-block mermaid-source">
        <code>{source || 'Mermaid diagram source'}</code>
      </pre>
    );
  }

  const columns = Math.min(3, Math.max(1, diagram.nodes.length));
  const nodeWidth = 164;
  const nodeHeight = 58;
  const gapX = 54;
  const gapY = 54;
  const width = columns * nodeWidth + (columns - 1) * gapX + 36;
  const rows = Math.ceil(diagram.nodes.length / columns);
  const height = rows * nodeHeight + (rows - 1) * gapY + 36;
  const positions = new Map(diagram.nodes.map((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return [node.id, { x: 18 + column * (nodeWidth + gapX), y: 18 + row * (nodeHeight + gapY) }];
  }));

  return (
    <div className="mermaid-preview">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Mermaid diagram preview">
        <defs>
          <marker id="mermaid-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" />
          </marker>
        </defs>
        {diagram.edges.map((edge, index) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const x1 = from.x + nodeWidth;
          const y1 = from.y + nodeHeight / 2;
          const x2 = to.x;
          const y2 = to.y + nodeHeight / 2;
          const middleX = (x1 + x2) / 2;
          const middleY = (y1 + y2) / 2;

          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <path className="mermaid-edge" d={`M ${x1} ${y1} C ${middleX} ${y1}, ${middleX} ${y2}, ${x2} ${y2}`} markerEnd="url(#mermaid-arrow)" />
              {edge.label ? <text className="mermaid-edge-label" x={middleX} y={middleY - 8}>{edge.label}</text> : null}
            </g>
          );
        })}
        {diagram.nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) return null;
          return (
            <g key={node.id}>
              <rect className="mermaid-node" x={position.x} y={position.y} width={nodeWidth} height={nodeHeight} rx="14" />
              <text className="mermaid-node-label" x={position.x + nodeWidth / 2} y={position.y + nodeHeight / 2 + 5}>{node.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MarkdownPreview({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim()) continue;

    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const language = fence[1]?.toLowerCase() || 'text';
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      const code = codeLines.join('\n');
      blocks.push(language === 'mermaid' ? <MermaidPreview key={index} source={code} /> : <pre className="markdown-code-block" key={index}><span>{language}</span><code>{code}</code></pre>);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const content = renderInlineMarkdown(heading[2]);
      blocks.push(level === 1 ? <h1 key={index}>{content}</h1> : level === 2 ? <h2 key={index}>{content}</h2> : <h3 key={index}>{content}</h3>);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ''));
        index += 1;
      }
      index -= 1;
      blocks.push(<ul key={index}>{items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      index -= 1;
      blocks.push(<ol key={index}>{items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}</ol>);
      continue;
    }

    if (/^>\s+/.test(line)) {
      blocks.push(<blockquote key={index}>{renderInlineMarkdown(line.replace(/^>\s+/, ''))}</blockquote>);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={index} />);
      continue;
    }

    const paragraph = [line];
    while (index + 1 < lines.length && lines[index + 1].trim() && !/^(#{1,3})\s+/.test(lines[index + 1]) && !/^(```|[-*]\s+|\d+\.\s+|>\s+|---+$)/.test(lines[index + 1])) {
      index += 1;
      paragraph.push(lines[index]);
    }
    blocks.push(<p key={index}>{renderInlineMarkdown(paragraph.join(' '))}</p>);
  }

  return blocks.length ? <div className="markdown-preview">{blocks}</div> : <div className="markdown-preview empty-markdown">Nothing to preview yet.</div>;
}

function LegacyNotesPage({ notes, setNotes, setToast }: { notes: NoteItem[]; setNotes: (notes: NoteItem[]) => void; setToast: (value: string) => void }) {
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

type SaveCoverLetterInput = {
  name: string;
  content: string;
  language: string;
  targetRole: string;
  companyName: string;
  jobTitle: string;
};

function AIToolsPage({ documents, documentsLoading, onRefreshDocuments, setToast, onSaveCoverLetter }: { documents: DocumentItem[]; documentsLoading?: boolean; onRefreshDocuments?: () => void; setToast: (value: string) => void; onSaveCoverLetter: (input: SaveCoverLetterInput) => Promise<void> }) {
  const cvDocuments = documents.filter((document) => document.type === 'CV' && document.status !== 'Archived');
  const cvOptions = cvDocuments.map((document) => ({
    id: String(document.id),
    label: `${document.name}${document.fileName ? ` (${document.fileName})` : ` (${document.size})`}`
  }));
  const generatedCoverLetters = documents
    .filter((document) => document.type === 'Cover letter' && document.status !== 'Archived')
    .filter((document) => document.category.toLowerCase() === 'ai generated' || document.tags?.some((tag) => tag.toLowerCase() === 'ai'))
    .sort((first, second) => (second.updatedAt || second.updated).localeCompare(first.updatedAt || first.updated))
    .slice(0, 4);
  const [activeTool, setActiveTool] = useState<'review' | 'cover'>('review');
  const [reviews, setReviews] = useState<CvReviewDto[]>([]);
  const [selectedReview, setSelectedReview] = useState<CvReviewDto | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [error, setError] = useState('');
  const [reviewForm, setReviewForm] = useState<CvReviewRequest>({
    documentId: '',
    reviewType: 'general',
    language: 'en',
    jobTitle: '',
    experienceLevel: '',
    jobDescription: ''
  });
  const [coverForm, setCoverForm] = useState({
    documentId: '',
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    language: 'en' as 'en' | 'pl',
    tone: 'professional' as 'professional' | 'natural' | 'formal',
    length: 'standard' as 'short' | 'standard' | 'detailed',
    additionalContext: ''
  });
  const [coverResult, setCoverResult] = useState<CoverLetterGenerateResponse | null>(null);
  const [editableCoverLetter, setEditableCoverLetter] = useState('');
  const selectedReviewCvLabel = cvOptions.find((option) => option.id === reviewForm.documentId)?.label || cvOptions[0]?.label || '';
  const selectedCoverCvLabel = cvOptions.find((option) => option.id === coverForm.documentId)?.label || cvOptions[0]?.label || '';

  useEffect(() => {
    if (!cvDocuments.length) return;
    const firstCvId = String(cvDocuments[0].id);
    setReviewForm((current) => current.documentId ? current : { ...current, documentId: firstCvId });
    setCoverForm((current) => current.documentId ? current : { ...current, documentId: firstCvId });
  }, [cvDocuments.length]);

  useEffect(() => {
    let active = true;
    setLoadingReviews(true);
    aiApi.getCvReviews()
      .then((items) => {
        if (!active) return;
        setReviews(items);
        setSelectedReview((current) => current ?? items.find((item) => item.status === 'Completed') ?? items[0] ?? null);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'AI activity could not be loaded.');
      })
      .finally(() => {
        if (active) setLoadingReviews(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function setReview<K extends keyof CvReviewRequest>(key: K, value: CvReviewRequest[K]) {
    setReviewForm((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function setCover<K extends keyof typeof coverForm>(key: K, value: typeof coverForm[K]) {
    setCoverForm((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function cvIdFromLabel(label: string) {
    return cvOptions.find((option) => option.label === label)?.id || cvOptions[0]?.id || '';
  }

  async function runReview(event: FormEvent) {
    event.preventDefault();

    if (!reviewForm.documentId) {
      setError('Upload a CV in Documents before running AI review.');
      return;
    }

    if (reviewForm.reviewType === 'job-match' && !reviewForm.jobDescription?.trim()) {
      setError('Paste a job description for Job Match Review.');
      return;
    }

    setReviewBusy(true);
    setError('');

    try {
      const review = await aiApi.createCvReview(reviewForm);
      setReviews((current) => [review, ...current.filter((item) => item.id !== review.id)]);
      setSelectedReview(review);
      setToast('CV review completed.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'CV review could not be completed.');
    } finally {
      setReviewBusy(false);
    }
  }

  async function deleteReview(id: string) {
    try {
      await aiApi.deleteCvReview(id);
      setReviews((current) => current.filter((item) => item.id !== id));
      if (selectedReview?.id === id) setSelectedReview(null);
      setToast('AI review removed.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'AI review could not be removed.');
    }
  }

  async function generateCoverLetter(event?: FormEvent) {
    event?.preventDefault();

    if (!coverForm.documentId) {
      setError('Upload a CV in Documents before generating a cover letter.');
      return;
    }

    if (!coverForm.companyName.trim() || !coverForm.jobTitle.trim() || !coverForm.jobDescription.trim()) {
      setError('Company, job title and job description are required.');
      return;
    }

    setCoverBusy(true);
    setError('');

    try {
      const response = await aiApi.generateCoverLetter(coverForm);
      setCoverResult(response);
      setEditableCoverLetter(response.coverLetter);
      setToast('Cover letter generated.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cover letter could not be generated.');
    } finally {
      setCoverBusy(false);
    }
  }

  async function copyCoverLetter() {
    if (!editableCoverLetter.trim()) return;
    await navigator.clipboard?.writeText(editableCoverLetter);
    setToast('Cover letter copied.');
  }

  function downloadCoverLetter() {
    const blob = new Blob([editableCoverLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = coverResult?.suggestedFileName || 'cover-letter.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveCoverLetter() {
    if (!coverResult || !editableCoverLetter.trim()) return;

    setSavingCover(true);
    setError('');

    try {
      await onSaveCoverLetter({
        name: (coverResult.suggestedFileName || 'Cover letter.txt').replace(/\.txt$/i, ''),
        content: editableCoverLetter,
        language: coverForm.language,
        targetRole: coverForm.jobTitle,
        companyName: coverForm.companyName,
        jobTitle: coverForm.jobTitle
      });
      setToast('Cover letter saved in Documents.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cover letter could not be saved.');
    } finally {
      setSavingCover(false);
    }
  }

  return (
    <section className="page-section ai-tools-page">
      <div className="ai-privacy-note panel-card">
        <Sparkles size={20} />
        <div>
          <strong>AI privacy notice</strong>
          <p>The content of your CV and job description will be sent to the configured AI provider to generate the requested result.</p>
        </div>
      </div>

      <div className="ai-tool-grid">
        <button className={`ai-tool-card panel-card ${activeTool === 'review' ? 'active' : ''}`} type="button" onClick={() => setActiveTool('review')}>
          <span><FileText size={22} /></span>
          <div><h2>AI CV Review</h2><p>Analyze your CV, identify strengths and weaknesses, check ATS compatibility and compare it with a job offer.</p></div>
          <strong>Review CV</strong>
        </button>
        <button className={`ai-tool-card panel-card ${activeTool === 'cover' ? 'active' : ''}`} type="button" onClick={() => setActiveTool('cover')}>
          <span><Edit3 size={22} /></span>
          <div><h2>AI Cover Letter Generator</h2><p>Generate a personalized cover letter based on your CV and a selected job offer.</p></div>
          <strong>Generate cover letter</strong>
        </button>
      </div>

      {!cvDocuments.length ? (
        <div className="panel-card empty-state">
          <FileText size={28} />
          <strong>No CV documents yet</strong>
          <span>Upload a document marked as CV in Documents before using AI Tools.</span>
          <button className="secondary-button" type="button" onClick={onRefreshDocuments} disabled={documentsLoading}>Refresh documents</button>
        </div>
      ) : null}

      {error ? <p className="form-error ai-error" role="alert">{error}</p> : null}

      <div className="ai-workspace-grid">
        <section className="panel-card ai-form-panel">
          {activeTool === 'review' ? (
            <form className="modal-form compact-ai-form" onSubmit={runReview}>
              <div className="mini-title"><FileText size={18} /><h2>AI CV Review</h2></div>
              <div className="form-grid">
                <div className="form-field"><span>CV document</span><CustomSelect value={selectedReviewCvLabel} options={cvOptions.map((option) => option.label)} onChange={(value) => setReview('documentId', cvIdFromLabel(value))} /></div>
                <div className="form-field"><span>Analysis type</span><CustomSelect value={reviewForm.reviewType} options={['general', 'job-match']} onChange={(value) => setReview('reviewType', value as CvReviewRequest['reviewType'])} /></div>
                <div className="form-field"><span>Report language</span><CustomSelect value={reviewForm.language} options={['en', 'pl']} onChange={(value) => setReview('language', value as CvReviewRequest['language'])} /></div>
                <TextField label="Job title" value={reviewForm.jobTitle || ''} onChange={(value) => setReview('jobTitle', value)} placeholder="Junior .NET Developer" />
                <TextField label="Experience level" value={reviewForm.experienceLevel || ''} onChange={(value) => setReview('experienceLevel', value)} placeholder="Junior" />
              </div>
              <TextAreaField label="Job description" value={reviewForm.jobDescription || ''} onChange={(value) => setReview('jobDescription', value)} placeholder="Required for Job Match Review." />
              <button className="primary-button ai-form-action" type="submit" disabled={reviewBusy || !cvDocuments.length}>{reviewBusy ? 'Analyzing...' : 'Run review'}</button>
            </form>
          ) : (
            <form className="modal-form compact-ai-form" onSubmit={generateCoverLetter}>
              <div className="mini-title"><Edit3 size={18} /><h2>AI Cover Letter Generator</h2></div>
              <div className="form-grid">
                <div className="form-field"><span>CV document</span><CustomSelect value={selectedCoverCvLabel} options={cvOptions.map((option) => option.label)} onChange={(value) => setCover('documentId', cvIdFromLabel(value))} /></div>
                <TextField label="Company name" value={coverForm.companyName} onChange={(value) => setCover('companyName', value)} placeholder="Example Company" />
                <TextField label="Job title" value={coverForm.jobTitle} onChange={(value) => setCover('jobTitle', value)} placeholder="Junior .NET Developer" />
                <div className="form-field"><span>Language</span><CustomSelect value={coverForm.language} options={['en', 'pl']} onChange={(value) => setCover('language', value as 'en' | 'pl')} /></div>
                <div className="form-field"><span>Tone</span><CustomSelect value={coverForm.tone} options={['professional', 'natural', 'formal']} onChange={(value) => setCover('tone', value as typeof coverForm.tone)} /></div>
                <div className="form-field"><span>Length</span><CustomSelect value={coverForm.length} options={['short', 'standard', 'detailed']} onChange={(value) => setCover('length', value as typeof coverForm.length)} /></div>
              </div>
              <TextAreaField label="Job description" value={coverForm.jobDescription} onChange={(value) => setCover('jobDescription', value)} placeholder="Paste the job offer here." />
              <TextAreaField label="Additional context" value={coverForm.additionalContext} onChange={(value) => setCover('additionalContext', value)} placeholder="Optional details you want to include, only if true." />
              <button className="primary-button" type="submit" disabled={coverBusy || !cvDocuments.length}>{coverBusy ? 'Generating...' : coverResult ? 'Generate again' : 'Generate'}</button>
            </form>
          )}
        </section>

        <section className="panel-card ai-result-panel">
          {activeTool === 'review' ? <CvReviewReport review={selectedReview} busy={reviewBusy} onRerun={() => setActiveTool('review')} /> : (
            <CoverLetterEditor
              result={coverResult}
              value={editableCoverLetter}
              onChange={setEditableCoverLetter}
              busy={coverBusy}
              saving={savingCover}
              onCopy={copyCoverLetter}
              onDownload={downloadCoverLetter}
              onSave={saveCoverLetter}
              onGenerateAgain={() => void generateCoverLetter()}
            />
          )}
        </section>
      </div>

      <section className="panel-card ai-activity-panel">
        <div className="mini-title"><Clock size={18} /><h2>Recent AI Activity</h2></div>
        {loadingReviews ? <AiSkeleton /> : reviews.length || generatedCoverLetters.length ? (
          <div className="ai-activity-list">
            {reviews.slice(0, 8).map((review) => (
              <div key={review.id} className={`ai-activity-item ${selectedReview?.id === review.id ? 'active' : ''}`}>
                <button className="ai-activity-select" type="button" onClick={() => { setSelectedReview(review); setActiveTool('review'); }}>
                  <span><FileText size={16} /></span>
                  <div><strong>{review.documentName}</strong><small>{review.reviewType} - {formatDate(review.createdAt.slice(0, 10))} - {review.status}</small></div>
                  {review.overallScore !== null && review.overallScore !== undefined ? <em>{review.overallScore}</em> : null}
                </button>
                <button className="ghost-icon danger" type="button" aria-label="Delete AI review" onClick={(event) => { event.stopPropagation(); void deleteReview(review.id); }}><Trash2 size={15} /></button>
              </div>
            ))}
            {generatedCoverLetters.map((document) => (
              <div key={`cover-${document.id}`} className="ai-activity-item">
                <button className="ai-activity-select" type="button" onClick={() => { setActiveTool('cover'); setToast('Saved cover letter is available in Documents.'); }}>
                  <span><Edit3 size={16} /></span>
                  <div><strong>{document.name}</strong><small>cover letter - {formatDate((document.updatedAt || document.updated).slice(0, 10))} - saved in Documents</small></div>
                  <em>DOC</em>
                </button>
              </div>
            ))}
          </div>
        ) : <p className="empty-panel-note">No AI activity yet.</p>}
      </section>
    </section>
  );
}

function AiSkeleton() {
  return <div className="ai-skeleton"><span /><span /><span /></div>;
}

function ScoreBar({ label, score, note }: { label: string; score: number; note?: string }) {
  return (
    <div className="score-row">
      <div><strong>{label}</strong>{note ? <small>{note}</small> : null}</div>
      <span>{score}/100</span>
      <div className="score-track" aria-label={`${label} score ${score} out of 100`}><i style={{ width: `${clamp(score, 0, 100)}%` }} /></div>
    </div>
  );
}

function CvReviewReport({ review, busy, onRerun }: { review: CvReviewDto | null; busy: boolean; onRerun: () => void }) {
  if (busy) {
    return <div className="ai-result-empty"><AiSkeleton /><strong>Analyzing CV...</strong><span>Reading your document and preparing a structured report.</span></div>;
  }

  if (!review) {
    return <div className="ai-result-empty"><Sparkles size={28} /><strong>No report selected</strong><span>Run a CV review or choose an item from Recent AI Activity.</span></div>;
  }

  if (review.status !== 'Completed' || !review.result) {
    return <div className="ai-result-empty"><AlertCircle size={28} /><strong>{review.status}</strong><span>{review.errorMessage || 'This report is not available.'}</span></div>;
  }

  const result = review.result;

  return (
    <div className="cv-review-report">
      <header className="ai-report-header">
        <div>
          <span className="eyebrow">{review.reviewType}</span>
          <h2>{review.documentName}</h2>
          <p>{formatDate(review.createdAt.slice(0, 10))}{review.jobTitle ? ` - ${review.jobTitle}` : ''}</p>
        </div>
        <button className="secondary-button" type="button" onClick={onRerun}><Sparkles size={16} /> Run again</button>
      </header>

      <div className="ai-score-hero">
        <strong>{result.overallScore}</strong>
        <span>Overall Score</span>
        <p>{result.summary}</p>
      </div>

      <section className="ai-report-section">
        <h3>Category Scores</h3>
        {result.categoryScores.map((score) => <ScoreBar key={score.name} label={score.name} score={score.score} note={score.note} />)}
      </section>

      <section className="ai-report-grid">
        <div><h3>Strengths</h3>{result.strengths.map((item) => <span className="ai-tag positive" key={item}><CheckCircle2 size={14} /> {item}</span>)}</div>
        <div><h3>Recommended Actions</h3>{result.recommendedActions.map((item) => <span className="ai-tag" key={item}><CheckSquare size={14} /> {item}</span>)}</div>
      </section>

      <section className="ai-report-section">
        <h3>Issues to Improve</h3>
        {result.issues.map((issue, index) => (
          <details className="ai-accordion" key={`${issue.title}-${index}`}>
            <summary><span className={`priority priority-${issue.priority.toLowerCase()}`}>{issue.priority || 'Priority'}</span><strong>{issue.title}</strong><small>{issue.section}</small></summary>
            <p>{issue.description}</p>
            <small>Suggested fix: {issue.suggestedFix}</small>
          </details>
        ))}
      </section>

      <section className="ai-report-section">
        <h3>ATS Compatibility</h3>
        <ScoreBar label="ATS" score={result.atsCompatibility.score} note={result.atsCompatibility.summary} />
        <div className="ai-tag-list">{result.atsCompatibility.improvements.map((item) => <span className="ai-tag" key={item}>{item}</span>)}</div>
      </section>

      {result.missingKeywords.length ? <section className="ai-report-section"><h3>Missing Keywords</h3><div className="ai-tag-list">{result.missingKeywords.map((keyword) => <span className="ai-tag warning" key={keyword}>{keyword}</span>)}</div></section> : null}

      <section className="ai-report-section">
        <h3>Section Review</h3>
        {result.sectionReviews.map((section) => (
          <details className="ai-accordion" key={section.section}>
            <summary><strong>{section.section}</strong><span>{section.score}/100</span></summary>
            <p>{section.summary}</p>
            <div className="ai-tag-list">{section.suggestions.map((item) => <span className="ai-tag" key={item}>{item}</span>)}</div>
          </details>
        ))}
      </section>

      {result.jobMatchScore !== null && result.jobMatchScore !== undefined ? <ScoreBar label="Job Match" score={result.jobMatchScore} /> : null}
    </div>
  );
}

function CoverLetterEditor({ result, value, onChange, busy, saving, onCopy, onDownload, onSave, onGenerateAgain }: { result: CoverLetterGenerateResponse | null; value: string; onChange: (value: string) => void; busy: boolean; saving: boolean; onCopy: () => void; onDownload: () => void; onSave: () => void; onGenerateAgain: () => void }) {
  if (busy) {
    return <div className="ai-result-empty"><AiSkeleton /><strong>Generating cover letter...</strong><span>Using your CV and the selected offer.</span></div>;
  }

  if (!result) {
    return <div className="ai-result-empty"><Edit3 size={28} /><strong>No cover letter yet</strong><span>Generate a draft, edit it here, then save it to Documents.</span></div>;
  }

  return (
    <div className="cover-letter-editor">
      <div className="ai-report-header">
        <div><span className="eyebrow">Editable draft</span><h2>{result.suggestedFileName}</h2></div>
        <div className="event-card-actions">
          <button className="ghost-icon" type="button" onClick={onCopy} aria-label="Copy cover letter"><Copy size={16} /></button>
          <button className="ghost-icon" type="button" onClick={onDownload} aria-label="Download cover letter"><Download size={16} /></button>
        </div>
      </div>
      {result.warnings.length ? <div className="ai-warning-list">{result.warnings.map((warning) => <span key={warning}><AlertCircle size={14} /> {warning}</span>)}</div> : null}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      <div className="modal-footer inline-footer">
        <button className="secondary-button" type="button" onClick={onGenerateAgain}>Generate again</button>
        <button className="primary-button" type="button" onClick={onSave} disabled={saving || !value.trim()}>{saving ? 'Saving...' : 'Save as document'}</button>
      </div>
    </div>
  );
}

function NotesPage({ notes, setNotes, setToast }: { notes: NoteItem[]; setNotes: (notes: NoteItem[]) => void; setToast: (value: string) => void }) {
  const [selectedId, setSelectedId] = useState(notes[0]?.id || 0);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [noteMenuOpen, setNoteMenuOpen] = useState(false);
  const [noteBodyMode, setNoteBodyMode] = useState<'write' | 'preview'>('write');
  const noteActionsRef = useRef<HTMLDivElement | null>(null);
  const attachmentInput = useRef<HTMLInputElement | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const noteTypes = Array.from(new Set(notes.map((note) => note.type || note.tag).filter(Boolean)));
  const filteredNotes = notes
    .filter((note) => {
      const haystack = `${note.title} ${note.company} ${note.application} ${note.tag} ${note.type ?? ''} ${note.tags?.join(' ') ?? ''} ${note.attachments?.map((attachment) => attachment.name).join(' ') ?? ''} ${note.body}`.toLowerCase();
      return haystack.includes(query.toLowerCase()) && (typeFilter === 'All' || (note.type || note.tag) === typeFilter);
    })
    .sort((first, second) => Number(Boolean(second.pinned)) - Number(Boolean(first.pinned)) || second.updated.localeCompare(first.updated));
  const pinnedNotes = filteredNotes.filter((note) => note.pinned);
  const regularNotes = filteredNotes.filter((note) => !note.pinned);
  const selected = notes.find((note) => note.id === selectedId) || filteredNotes[0] || notes[0];
  const selectedChecklist = selected?.checklist ?? [];
  const selectedAttachments = selected?.attachments ?? [];
  useEffect(() => {
    setNoteMenuOpen(false);
  }, [selectedId]);
  useEffect(() => {
    if (!noteMenuOpen) return;

    function close(event: MouseEvent) {
      if (!noteActionsRef.current?.contains(event.target as Node)) {
        setNoteMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [noteMenuOpen]);
  function patchNote(patch: Partial<NoteItem>) {
    if (!selected) return;
    setNotes(notes.map((note) => note.id === selected.id ? { ...note, ...patch, updated: today(), lastEdited: today() } : note));
  }
  function patchNoteBody(body: string) {
    patchNote({ body, preview: body.slice(0, 120) });
  }
  function insertNoteSnippet(snippet: string) {
    if (!selected) return;

    setNoteBodyMode('write');

    const textarea = bodyTextareaRef.current;
    const body = selected.body || '';
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? body.length;
    const prefix = start > 0 && !body.slice(0, start).endsWith('\n') ? '\n\n' : '';
    const suffix = end < body.length && !body.slice(end).startsWith('\n') ? '\n\n' : '';
    const insertion = `${prefix}${snippet}${suffix}`;
    const nextBody = `${body.slice(0, start)}${insertion}${body.slice(end)}`;

    patchNoteBody(nextBody);
    window.setTimeout(() => {
      bodyTextareaRef.current?.focus();
      const cursor = start + insertion.length;
      bodyTextareaRef.current?.setSelectionRange(cursor, cursor);
    }, 0);
  }
  function addNote() {
    const note: NoteItem = { id: makeId(), title: 'New recruitment note', company: 'General', application: 'General', tag: 'General', type: 'General', tags: ['General'], updated: today(), lastEdited: today(), preview: 'Start writing here.', body: 'Start writing here.', pinned: false, favorite: false, attachments: [], checklist: [{ id: makeId(), text: 'First checklist item', done: false }] };
    setNotes([note, ...notes]);
    setSelectedId(note.id);
    setToast('Note added.');
  }
  function duplicateNote(note: NoteItem) {
    const copy = { ...note, id: makeId(), title: `${note.title} copy`, pinned: false, attachments: (note.attachments ?? []).map((attachment) => ({ ...attachment, id: makeId() })), updated: today(), lastEdited: today() };
    setNotes([copy, ...notes]);
    setSelectedId(copy.id);
    setToast('Note duplicated.');
  }
  async function copyNoteBody(note: NoteItem) {
    try {
      await navigator.clipboard.writeText(note.body || note.preview || note.title);
      setToast('Note copied.');
    } catch {
      setToast('Could not copy note.');
    } finally {
      setNoteMenuOpen(false);
    }
  }
  function deleteNote(id: number) {
    const next = notes.filter((note) => note.id !== id);
    setNotes(next);
    setSelectedId(next[0]?.id || 0);
    setNoteMenuOpen(false);
    setToast('Note deleted.');
  }
  function togglePinned() {
    if (!selected) return;
    patchNote({ pinned: !selected.pinned });
    setToast(selected.pinned ? 'Note unpinned.' : 'Note pinned.');
  }
  async function addAttachments(files: FileList | null) {
    if (!selected || !files?.length) return;

    const selectedFiles = Array.from(files);
    const oversized = selectedFiles.find((file) => file.size > maxNoteAttachmentBytes);

    if (oversized) {
      setToast(`${oversized.name} is too large. Maximum size is ${formatFileSize(maxNoteAttachmentBytes)}.`);
      if (attachmentInput.current) attachmentInput.current.value = '';
      return;
    }

    try {
      const nextAttachments = await Promise.all(selectedFiles.map(async (file) => ({
        id: makeId(),
        name: repairTextEncoding(file.name),
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: await readFileAsDataUrl(file),
        addedAt: today()
      })));
      patchNote({ attachments: [...selectedAttachments, ...nextAttachments] });
      setToast(nextAttachments.length === 1 ? 'Attachment added.' : `${nextAttachments.length} attachments added.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Attachment could not be added.');
    } finally {
      if (attachmentInput.current) attachmentInput.current.value = '';
    }
  }
  function removeAttachment(id: number) {
    if (!selected) return;
    patchNote({ attachments: selectedAttachments.filter((attachment) => attachment.id !== id) });
    setToast('Attachment removed.');
  }
  function openAttachment(attachment: NoteAttachment) {
    const opened = window.open(attachment.dataUrl, '_blank');
    if (!opened) downloadDataUrl(attachment.dataUrl, attachment.name);
  }
  function addChecklistItem() { if (!selected) return; patchNote({ checklist: [...selectedChecklist, { id: makeId(), text: 'New checklist item', done: false }] }); }
  function updateChecklist(id: number, patch: Partial<ChecklistItem>) { if (!selected) return; patchNote({ checklist: selectedChecklist.map((item) => item.id === id ? { ...item, ...patch } : item) }); }
  function deleteChecklist(id: number) { if (!selected) return; patchNote({ checklist: selectedChecklist.filter((item) => item.id !== id) }); }
  const doneCount = selectedChecklist.filter((item) => item.done).length;
  const totalCount = selectedChecklist.length;
  const renderNoteCard = (note: NoteItem) => (
    <button key={note.id} className={`note-card ${note.pinned ? 'pinned' : ''} ${selected?.id === note.id ? 'selected' : ''}`} type="button" onClick={() => setSelectedId(note.id)}>
      <strong className="note-card-title">
        {note.pinned ? <Pin size={13} aria-hidden="true" /> : null}
        <span>{note.title}</span>
      </strong>
      <span>{note.company} - {note.type || note.tag}</span>
      <small>{formatDate(note.lastEdited || note.updated)}{note.attachments?.length ? ` - ${note.attachments.length} attachments` : ''}</small>
    </button>
  );
  return (
    <section className="page-section">
      <div className="toolbar">
        <div className="search-field wide"><Search size={18} /><input placeholder="Search notes..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <CustomSelect label="Type" value={typeFilter} options={['All', ...noteTypes]} onChange={setTypeFilter} />
        <button className="primary-button" type="button" onClick={addNote}><Plus size={17} /> Add note</button>
      </div>
      <div className="notes-layout">
        <aside className="notes-list panel-card custom-scroll">
          {pinnedNotes.map(renderNoteCard)}
          {pinnedNotes.length && regularNotes.length ? <div className="note-list-divider" aria-hidden="true" /> : null}
          {regularNotes.map(renderNoteCard)}
          {!filteredNotes.length ? <div className="empty-state inline-empty"><StickyNote size={24} /><strong>No matching notes</strong><span>Clear search or change the filter.</span></div> : null}
        </aside>
        {selected ? (
          <section className="panel-card note-editor">
            <div className="note-editor-head">
              <TextField label="Title" value={selected.title} onChange={(value) => patchNote({ title: value })} />
              <div className="document-actions note-actions" ref={noteActionsRef}>
                <button className={`ghost-icon note-toggle ${selected.pinned ? 'active' : ''}`} type="button" aria-label="Toggle pinned note" aria-pressed={Boolean(selected.pinned)} onClick={togglePinned}><Pin size={18} /></button>
                <div className="note-more-wrap">
                  <button className={`ghost-icon note-toggle ${noteMenuOpen ? 'active' : ''}`} type="button" aria-label="Open note actions" aria-expanded={noteMenuOpen} onClick={() => setNoteMenuOpen((open) => !open)}><MoreHorizontal size={18} /></button>
                  {noteMenuOpen ? (
                    <div className="note-actions-menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => { duplicateNote(selected); setNoteMenuOpen(false); }}><Copy size={16} /> Duplicate note</button>
                      <button type="button" role="menuitem" onClick={() => void copyNoteBody(selected)}><FileText size={16} /> Copy note body</button>
                    </div>
                  ) : null}
                </div>
                <button className="ghost-icon danger" type="button" aria-label="Delete note" onClick={() => deleteNote(selected.id)}><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="form-grid">
              <TextField label="Company" value={selected.company} onChange={(value) => patchNote({ company: value })} />
              <TextField label="Application" value={selected.application} onChange={(value) => patchNote({ application: value })} />
              <TextField label="Type" value={selected.type || selected.tag} onChange={(value) => patchNote({ type: value, tag: value })} />
              <TextField label="Tags" value={(selected.tags ?? [selected.tag]).join(', ')} onChange={(value) => patchNote({ tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })} />
            </div>
            <section className="note-body-panel full-field">
              <div className="note-body-toolbar">
                <span className="setting-label">Note body</span>
                <div className="segmented-inline note-view-toggle">
                  <button type="button" className={noteBodyMode === 'write' ? 'selected' : ''} onClick={() => setNoteBodyMode('write')}>Write</button>
                  <button type="button" className={noteBodyMode === 'preview' ? 'selected' : ''} onClick={() => setNoteBodyMode('preview')}><Eye size={15} /> Preview</button>
                </div>
                <div className="note-code-actions">
                  <button className="secondary-button small" type="button" onClick={() => insertNoteSnippet(markdownNoteSnippet)}><FileText size={15} /> Markdown</button>
                  <button className="secondary-button small" type="button" onClick={() => insertNoteSnippet(codeNoteSnippet)}><Code2 size={15} /> Code</button>
                  <button className="secondary-button small" type="button" onClick={() => insertNoteSnippet(mermaidNoteSnippet)}><Table2 size={15} /> Mermaid</button>
                </div>
              </div>
              {noteBodyMode === 'write' ? (
                <textarea ref={bodyTextareaRef} value={selected.body} onChange={(event) => patchNoteBody(event.target.value)} />
              ) : (
                <MarkdownPreview text={selected.body} />
              )}
            </section>
            <section className="note-attachments-panel">
              <div className="checklist-header">
                <h3><Paperclip size={17} /> Attachments ({selectedAttachments.length})</h3>
                <button className="secondary-button small" type="button" onClick={() => attachmentInput.current?.click()}><Upload size={15} /> Add files</button>
                <input ref={attachmentInput} type="file" multiple hidden onChange={(event) => void addAttachments(event.target.files)} />
              </div>
              {selectedAttachments.length ? (
                <div className="note-attachments-list">
                  {selectedAttachments.map((attachment) => (
                    <div className="note-attachment-row" key={attachment.id}>
                      <span className="attachment-icon"><FileText size={17} /></span>
                      <div>
                        <strong>{attachment.name}</strong>
                        <small>{formatFileSize(attachment.size)} · added {formatDate(attachment.addedAt)}</small>
                      </div>
                      <button className="ghost-icon" type="button" aria-label={`Open ${attachment.name}`} onClick={() => openAttachment(attachment)}><ExternalLink size={16} /></button>
                      <button className="ghost-icon" type="button" aria-label={`Download ${attachment.name}`} onClick={() => downloadDataUrl(attachment.dataUrl, attachment.name)}><Download size={16} /></button>
                      <button className="ghost-icon danger" type="button" aria-label={`Remove ${attachment.name}`} onClick={() => removeAttachment(attachment.id)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              ) : <p className="note-attachments-empty">No attachments yet. Add files up to {formatFileSize(maxNoteAttachmentBytes)} each.</p>}
            </section>
            <div className="checklist-panel">
              <div className="checklist-header"><h3>Checklist ({doneCount}/{totalCount})</h3><button className="secondary-button small" type="button" onClick={addChecklistItem}><Plus size={15} /> Add item</button></div>
              {selectedChecklist.map((item) => <div className="checklist-row" key={item.id}><button className={`check-box ${item.done ? 'checked' : ''}`} type="button" onClick={() => updateChecklist(item.id, { done: !item.done })}>{item.done ? <Check size={14} /> : null}</button><input value={item.text} onChange={(event) => updateChecklist(item.id, { text: event.target.value })} /><button className="ghost-icon danger" type="button" onClick={() => deleteChecklist(item.id)}><Trash2 size={15} /></button></div>)}
            </div>
            <div className="note-save-hint"><CheckCircle2 size={16} /> Changes are saved automatically in this workspace.</div>
          </section>
        ) : <section className="panel-card empty-state"><StickyNote size={28} /><strong>No note selected</strong><span>Add a note to start writing.</span></section>}
      </div>
    </section>
  );
}

function BaseModal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop"><section className="add-modal" role="dialog" aria-modal="true"><header className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="close-button" type="button" onClick={onClose}><X size={20} /></button></header>{children}</section></div>;
}

function ModalFooter({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return <footer className="modal-footer inner"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><CheckCircle2 size={17} /> {submitLabel}</button></footer>;
}

function ApplicationModal({ application, companies, documents, categoryOptions, levelOptions, onClose, onSave }: { application?: JobApplication; companies: Company[]; documents: DocumentItem[]; categoryOptions: string[]; levelOptions: string[]; onClose: () => void; onSave: (app: JobApplication) => void }) {
  const cvOptions = documents.filter((doc) => doc.type === 'CV').map((doc) => doc.name);
  const [form, setForm] = useState<Omit<JobApplication, 'id'>>(() => application ? { ...application } : { company: companies[0]?.name || '', companyId: companies[0]?.id, domain: companies[0]?.domain || '', position: '', category: '.NET', level: 'Internship', status: 'Applied', dateApplied: today(), lastContact: '', nextStep: 'Waiting', location: 'Remote', workMode: 'Hybrid', source: 'LinkedIn', offerUrl: '', requirements: '', benefits: '', notes: '', cv: cvOptions[0] || 'No CV selected' });
  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function chooseCompany(name: string) { const company = companies.find((item) => item.name === name); setForm((current) => ({ ...current, company: name, companyId: company?.id, domain: company?.domain || safeDomain(name), offerUrl: current.offerUrl || company?.website || '' })); }
  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({ ...form, id: application?.id || makeId(), domain: safeDomain(form.company, form.domain), cv: form.cv === 'No CV selected' ? '' : form.cv });
  }
  return <BaseModal title={application ? 'Edit application' : 'Add application'} subtitle="Create or update a recruitment entry." onClose={onClose}><form className="add-form custom-scroll" onSubmit={submit}><div className="form-grid"><div className="form-field"><span>Saved company</span><CustomSelect value={companies.some((c) => c.name === form.company) ? form.company : 'Custom company'} options={[...companies.map((c) => c.name), 'Custom company']} onChange={(v) => v === 'Custom company' ? set('company', '') : chooseCompany(v)} /></div><TextField label="Company name" value={form.company} onChange={(v) => set('company', v)} placeholder="Example Company" /><TextField label="Company domain" value={form.domain} onChange={(v) => set('domain', v)} placeholder="company.com" /><TextField label="Position" value={form.position} onChange={(v) => set('position', v)} placeholder=".NET Intern" /><TextField label="Offer URL" value={form.offerUrl} onChange={(v) => set('offerUrl', v)} placeholder="https://..." /><div className="form-field"><span>Category</span><CustomSelect value={form.category} options={categoryOptions} onChange={(v) => set('category', v)} /></div><div className="form-field"><span>Level</span><CustomSelect value={form.level} options={levelOptions} onChange={(v) => set('level', v)} /></div><div className="form-field"><span>Status</span><CustomSelect value={form.status} options={statuses} onChange={(v) => set('status', v as Status)} /></div><div className="form-field"><span>Source</span><CustomSelect value={form.source} options={sources} onChange={(v) => set('source', v)} /></div><TextField label="Location" value={form.location} onChange={(v) => set('location', v)} /><div className="form-field"><span>Work mode</span><CustomSelect value={form.workMode} options={workModes} onChange={(v) => set('workMode', v as WorkMode)} /></div><TextField label="Date applied" type="date" value={form.dateApplied} onChange={(v) => set('dateApplied', v)} /><TextField label="Last contact" type="date" value={form.lastContact} onChange={(v) => set('lastContact', v)} /><TextField label="Next step" value={form.nextStep} onChange={(v) => set('nextStep', v)} /><div className="form-field"><span>CV version</span><CustomSelect value={form.cv || 'No CV selected'} options={['No CV selected', ...cvOptions, 'Other']} onChange={(v) => set('cv', v)} /></div></div><TextAreaField label="Requirements" value={form.requirements} onChange={(v) => set('requirements', v)} placeholder="C#, SQL, Git..." /><TextAreaField label="Benefits" value={form.benefits} onChange={(v) => set('benefits', v)} placeholder="Hybrid work, mentoring..." /><TextAreaField label="Notes" value={form.notes} onChange={(v) => set('notes', v)} placeholder="What should you remember?" /><ModalFooter onClose={onClose} submitLabel={application ? 'Save changes' : 'Save application'} /></form></BaseModal>;
}

function ProfileCustomizationModal({ profile, setProfile, settings, setSettings, activeTab, setActiveTab, theme, setTheme, onClose, onImportCsv, onExport, onBackup, onReset, onSaveSettings, onSendNotificationTest }: { profile: Profile; setProfile: (profile: Profile) => void; settings: AppSettings; setSettings: (settings: AppSettings) => void; activeTab: ProfileTab; setActiveTab: (tab: ProfileTab) => void; theme: Theme; setTheme: (theme: Theme) => void; onClose: () => void; onImportCsv: (file: File) => void; onExport: () => void; onBackup: () => void; onReset: () => void; onSaveSettings?: (settings: AppSettings, profile: Profile) => void | Promise<void>; onSendNotificationTest?: (settings: AppSettings, profile: Profile) => void | Promise<void> }) {
  const originalSettings = useRef(settings);
  const originalTheme = useRef(theme);
  const [draftProfile, setDraftProfile] = useState(profile);
  const [draftSettings, setDraftSettings] = useState(settings);
  const [draftTheme, setDraftTheme] = useState(theme);
  const tabs: { id: ProfileTab; label: string; icon: typeof User }[] = [{ id: 'profile', label: 'Profile', icon: User }, { id: 'appearance', label: 'Appearance', icon: Palette }, { id: 'notifications', label: 'Notifications', icon: Bell }, { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal }, { id: 'data', label: 'Data', icon: Database }];
  useEffect(() => {
    setSettings(draftSettings);
  }, [draftSettings, setSettings]);

  useEffect(() => {
    setTheme(draftTheme);
  }, [draftTheme, setTheme]);

  function cancel() {
    setSettings(originalSettings.current);
    setTheme(originalTheme.current);
    onClose();
  }

  function save() {
    setProfile(draftProfile);
    setSettings(draftSettings);
    setTheme(draftTheme);
    void onSaveSettings?.(draftSettings, draftProfile);
    onClose();
  }
  return <div className="modal-backdrop"><section className="settings-modal" role="dialog" aria-modal="true"><header className="modal-header"><div><h2>Profile & customization</h2><p>Manage your profile, preferences and app settings.</p></div><button className="close-button" type="button" onClick={cancel}><X size={20} /></button></header><div className="settings-body"><aside className="settings-tabs">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} type="button" onClick={() => setActiveTab(tab.id)}><Icon size={17} /> {tab.label}</button>; })}</aside><main className="settings-content custom-scroll">{activeTab === 'profile' ? <ProfileTab profile={draftProfile} setProfile={setDraftProfile} /> : null}{activeTab === 'appearance' ? <AppearanceTab theme={draftTheme} setTheme={setDraftTheme} settings={draftSettings} setSettings={setDraftSettings} /> : null}{activeTab === 'notifications' ? <NotificationsTab settings={draftSettings} setSettings={setDraftSettings} onSendTest={() => onSendNotificationTest?.(draftSettings, draftProfile)} /> : null}{activeTab === 'preferences' ? <PreferencesTab settings={draftSettings} setSettings={setDraftSettings} /> : null}{activeTab === 'data' ? <DataTab onImportCsv={onImportCsv} onExport={onExport} onBackup={onBackup} onReset={onReset} /> : null}</main></div><footer className="modal-footer"><button className="secondary-button" type="button" onClick={cancel}>Cancel</button><button className="primary-button" type="button" onClick={save}><CheckCircle2 size={17} /> Save changes</button></footer></section></div>;
}

function ProfileTab({ profile, setProfile }: { profile: Profile; setProfile: Dispatch<SetStateAction<Profile>> }) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const currentVariant = normalizeAvatarVariant(profile.avatarVariant);
  const currentVariantLabel = avatarVariants.find((variant) => variant.id === currentVariant)?.label || 'Initials';

  function patchProfile(patch: Partial<Profile>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  function uploadAvatar(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (!avatarImageTypes.includes(file.type)) {
      setAvatarError('Choose a PNG, JPG or WebP image.');
      return;
    }

    if (file.size > maxAvatarImageBytes) {
      setAvatarError('Choose an image up to 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setAvatarError('This image could not be loaded. Try another file.');
        return;
      }

      patchProfile({ avatarImage: reader.result });
      setAvatarError('');
    };
    reader.onerror = () => setAvatarError('This image could not be loaded. Try another file.');
    reader.readAsDataURL(file);
  }

  return (
    <div className="tab-content">
      <div className="profile-photo-row">
        <ProfileAvatar profile={profile} className="profile-photo" iconSize={31} />
        <div className="profile-photo-copy">
          <h3>Profile photo</h3>
          <p>{profile.avatarImage ? `Custom photo. Frame: ${currentVariantLabel}.` : `Avatar variant: ${currentVariantLabel}.`}</p>
          <div className="avatar-actions">
            <button className="secondary-button small" type="button" onClick={() => fileInput.current?.click()}>
              <Upload size={15} /> Upload photo
            </button>
            {profile.avatarImage ? (
              <button className="text-button strong danger-text" type="button" onClick={() => patchProfile({ avatarImage: '' })}>
                Remove photo
              </button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => {
              uploadAvatar(event.target.files);
              event.currentTarget.value = '';
            }}
          />
          {avatarError ? <p className="form-error avatar-error" role="alert">{avatarError}</p> : null}
        </div>
      </div>
      <div className="setting-group">
        <span className="setting-label">Avatar frame</span>
        <div className="segmented-row avatar-frame-row">
          {avatarVariants.map((variant) => (
            <button
              key={variant.id}
              className={currentVariant === variant.id ? 'selected' : ''}
              type="button"
              onClick={() => patchProfile({ avatarVariant: variant.id })}
            >
              {variant.label}
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid">
        <TextField label="Full name" value={profile.name} onChange={(v) => patchProfile({ name: v })} />
        <TextField label="Email address" value={profile.email} onChange={(v) => patchProfile({ email: v })} />
        <TextField label="Job search title" value={profile.title} onChange={(v) => patchProfile({ title: v })} />
        <TextField label="Preferred location" value={profile.location} onChange={(v) => patchProfile({ location: v })} />
        <div className="form-field">
          <span>Preferred work mode</span>
          <CustomSelect value={profile.workMode} options={workModes} onChange={(v) => patchProfile({ workMode: v as WorkMode })} />
        </div>
      </div>
    </div>
  );
}

function AppearanceTab({ theme, setTheme, settings, setSettings }: { theme: Theme; setTheme: (theme: Theme) => void; settings: AppSettings; setSettings: (settings: AppSettings) => void }) {
  const accents: AppSettings['accent'][] = ['Taupe', 'Champagne', 'Dusty rose', 'Soft brown', 'Beige'];

  return (
    <div className="tab-content">
      <div className="setting-group">
        <span className="setting-label">Theme</span>
        <div className="segmented-row">
          <button className={theme === 'light' ? 'selected' : ''} type="button" onClick={() => setTheme('light')}><Sun size={16} /> Light</button>
          <button className={theme === 'dark' ? 'selected' : ''} type="button" onClick={() => setTheme('dark')}><Moon size={16} /> Dark</button>
          <button className={theme === 'system' ? 'selected' : ''} type="button" onClick={() => setTheme('system')}><Monitor size={16} /> System</button>
        </div>
      </div>
      <div className="setting-group">
        <span className="setting-label">Accent color</span>
        <div className="color-row">
          {accents.map((color) => (
            <button
              className={`color-dot ${settings.accent === color ? 'selected' : ''} ${color.toLowerCase().replaceAll(' ', '-')}`}
              type="button"
              key={color}
              onClick={() => setSettings({ ...settings, accent: color })}
              aria-pressed={settings.accent === color}
            >
              <span />
              {color}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-group">
        <span className="setting-label">Layout density</span>
        <div className="segmented-row">
          <button className={settings.density === 'Comfortable' ? 'selected' : ''} type="button" onClick={() => setSettings({ ...settings, density: 'Comfortable' })}>Comfortable</button>
          <button className={settings.density === 'Compact' ? 'selected' : ''} type="button" onClick={() => setSettings({ ...settings, density: 'Compact' })}>Compact</button>
        </div>
      </div>
      <ToggleRow title="Show motivational card in sidebar" text="Display cozy inspiration card at the bottom of the sidebar." checked={settings.showMotivation} onChange={(value) => setSettings({ ...settings, showMotivation: value })} />
      <ToggleRow title="Enable subtle animations" text="Smooth transitions for cards, modals and page changes." checked={settings.animations} onChange={(value) => setSettings({ ...settings, animations: value })} />
    </div>
  );
}

function ToggleRow({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="toggle-row"><div><strong>{title}</strong><span>{text}</span></div><button className={`toggle ${checked ? 'on' : ''}`} type="button" onClick={() => onChange(!checked)}><span /></button></div>;
}

function NotificationsTab({ settings, setSettings, onSendTest }: { settings: AppSettings; setSettings: (settings: AppSettings) => void; onSendTest?: () => void | Promise<void> }) {
  const n = settings.notifications;
  function patch(patchValue: Partial<AppSettings['notifications']>) { setSettings({ ...settings, notifications: { ...n, ...patchValue } }); }
  return (
    <div className="tab-content narrow-settings">
      <div className="notification-email-card">
        <TextField label="Notification email" value={n.email} onChange={(value) => patch({ email: value })} placeholder="example@mail.com" />
        <button className="secondary-button" type="button" disabled={!n.email.trim() || !onSendTest} onClick={() => { void onSendTest?.(); }}>
          <Mail size={16} /> Send test email
        </button>
        <span className={`sender-status ${n.emailConfigured ? 'ready' : 'pending'}`}>
          <span />
          {n.emailConfigured ? 'Sender ready' : 'Sender not configured'}
        </span>
      </div>
      <ToggleRow title="Interview reminders" text="Remind me 24h and 1h before each interview." checked={n.interviews} onChange={(value) => patch({ interviews: value })} />
      <ToggleRow title="Follow-up reminders" text="Remind me to follow up after no response." checked={n.followUps} onChange={(value) => patch({ followUps: value })} />
      <ToggleRow title="Application deadlines" text="Alerts for deadlines set on offers." checked={n.deadlines} onChange={(value) => patch({ deadlines: value })} />
      <ToggleRow title="Weekly recruitment summary" text="Every Monday overview of the past week." checked={n.weekly} onChange={(value) => patch({ weekly: value })} />
      <ToggleRow title="Monthly statistics report" text="First of each month recruitment statistics." checked={n.monthly} onChange={(value) => patch({ monthly: value })} />
      <div className="form-field slim"><span>Default reminder time</span><CustomSelect value={n.reminderTime} options={['15 minutes before', '1 hour before', '1 day before']} onChange={(value) => patch({ reminderTime: value })} /></div>
    </div>
  );
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

function DataTab({ onImportCsv, onExport, onBackup, onReset }: { onImportCsv: (file: File) => void; onExport: () => void; onBackup: () => void; onReset: () => void }) {
  const csvInput = useRef<HTMLInputElement | null>(null);

  function importCsv(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    onImportCsv(file);
    if (csvInput.current) csvInput.current.value = '';
  }

  return (
    <div className="data-actions">
      <button className="data-action" type="button" onClick={() => csvInput.current?.click()}>
        <span className="blue"><Upload size={20} /></span>
        <div><strong>Import CSV</strong><p>Add applications from a CSV file.</p></div>
      </button>
      <input ref={csvInput} type="file" accept=".csv,text/csv" hidden onChange={(event) => importCsv(event.target.files)} />
      <button className="data-action" type="button" onClick={onExport}><span className="green"><Download size={20} /></span><div><strong>Export CSV</strong><p>Download all applications as a CSV file.</p></div></button>
      <button className="data-action" type="button" onClick={onBackup}><span className="beige"><Database size={20} /></span><div><strong>Backup data</strong><p>Save a complete JSON backup of local workspace data.</p></div></button>
      <button className="data-action" type="button" onClick={onReset}><span className="danger"><Trash2 size={20} /></span><div><strong>Reset local data</strong><p>Clear local companies, events, notes and preferences.</p></div></button>
    </div>
  );
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

function useResolvedTheme(theme: Theme): 'light' | 'dark' {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemTheme(media.matches ? 'dark' : 'light');

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return theme === 'system' ? systemTheme : theme;
}

type MobileLayoutProps = {
  shellClass: string;
  page: Page;
  setPage: (page: Page) => void;
  profile: Profile;
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
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
  onStatusChange: (id: EntityId, status: Status) => void;
  onDeleteApplication: (id: EntityId) => void;
  onOpenSettings: (tab?: ProfileTab) => void;
  onLogout: () => void;
  onExport: () => void;
  documentsLoading?: boolean;
  documentsError?: string | null;
  onRefreshDocuments?: () => void;
  onUploadDocument?: (file: File) => Promise<void>;
  onCreateDocumentLink?: (doc: DocumentItem) => Promise<void>;
  onDeleteDocument?: (id: EntityId) => Promise<void>;
  onArchiveDocument?: (id: EntityId) => Promise<void>;
  onDownloadDocument?: (doc: DocumentItem) => Promise<void>;
  onPreviewDocument?: (doc: DocumentItem) => Promise<string>;
  onSaveCoverLetter: (input: SaveCoverLetterInput) => Promise<void>;
  onSyncNotificationEvent?: (event: CalendarEvent) => void;
  onDeleteNotificationEvent?: (id: number) => void;
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
  resolvedTheme,
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
  documentsLoading,
  documentsError,
  onRefreshDocuments,
  onUploadDocument,
  onCreateDocumentLink,
  onDeleteDocument,
  onArchiveDocument,
  onDownloadDocument,
  onPreviewDocument,
  onSaveCoverLetter,
  onSyncNotificationEvent,
  onDeleteNotificationEvent,
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
        resolvedTheme={resolvedTheme}
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
          <MobileCalendarPage events={events} applications={applications} setEvents={setEvents} setToast={setToast} onSyncNotificationEvent={onSyncNotificationEvent} onDeleteNotificationEvent={onDeleteNotificationEvent} />
        ) : null}

        {page === 'notes' ? <NotesPage notes={notes} setNotes={setNotes} setToast={setToast} /> : null}
        {page === 'companies' ? <CompaniesPage companies={companies} applications={applications} setCompanies={setCompanies} setToast={setToast} /> : null}
        {page === 'statistics' ? <StatisticsPage applications={applications} categoryOptions={categoryOptions} /> : null}
        {page === 'documents' ? <DocumentsPage documents={documents} applications={applications} setDocuments={setDocuments} onExport={onExport} setToast={setToast} loading={documentsLoading} error={documentsError} onRefresh={onRefreshDocuments} onUploadDocument={onUploadDocument} onCreateDocumentLink={onCreateDocumentLink} onDeleteDocument={onDeleteDocument} onArchiveDocument={onArchiveDocument} onDownloadDocument={onDownloadDocument} onPreviewDocument={onPreviewDocument} /> : null}
        {page === 'ai' ? <AIToolsPage documents={documents} documentsLoading={documentsLoading} onRefreshDocuments={onRefreshDocuments} setToast={setToast} onSaveCoverLetter={onSaveCoverLetter} /> : null}
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
          resolvedTheme={resolvedTheme}
          setTheme={setTheme}
          settings={settings}
        />
      ) : null}

      {children}
    </div>
  );
}

function MobileHeader({ page, profile, resolvedTheme, setTheme, onOpenSettings }: { page: Page; profile: Profile; resolvedTheme: 'light' | 'dark'; setTheme: (theme: Theme) => void; onOpenSettings: (tab?: ProfileTab) => void }) {
  const meta = pageLabels[page];
  const firstName = profile.name.split(' ')[0] || 'User';

  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <Logo />
        <div className="mobile-header-actions">
          <button className="icon-button" type="button" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>
            {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="mobile-avatar-button" type="button" onClick={() => onOpenSettings('profile')} aria-label="Open profile">
            <ProfileAvatar profile={profile} className="mobile-avatar-preview" iconSize={17} />
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

function MobileMoreMenu({ page, setPage, onClose, onOpenSettings, onLogout, onExport, theme, resolvedTheme, setTheme, settings }: { page: Page; setPage: (page: Page) => void; onClose: () => void; onOpenSettings: (tab?: ProfileTab) => void; onLogout: () => void; onExport: () => void; theme: Theme; resolvedTheme: 'light' | 'dark'; setTheme: (theme: Theme) => void; settings: AppSettings }) {
  const items: { id: Page; label: string; icon: typeof Building2; description: string }[] = [
    { id: 'companies', label: 'Companies', icon: Building2, description: 'Company history and contacts' },
    { id: 'statistics', label: 'Statistics', icon: BarChart3, description: 'Progress and response rates' },
    { id: 'documents', label: 'Documents', icon: FileText, description: 'CVs, links and files' },
    { id: 'ai', label: 'AI Tools', icon: Sparkles, description: 'CV review and cover letters' }
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
          <div><strong>Appearance</strong><small>{theme} · {settings.accent}</small></div>
        </button>
        <button type="button" onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>
          <span className="mobile-more-icon">{resolvedTheme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</span>
          <div><strong>Switch theme</strong><small>Change between light and dark mode</small></div>
        </button>
        <button type="button" onClick={onExport}>
          <span className="mobile-more-icon"><Download size={19} /></span>
          <div><strong>Export CSV</strong><small>Download applications data</small></div>
        </button>
        <button type="button" className="danger" onClick={onLogout}>
          <span className="mobile-more-icon"><LogOut size={19} /></span>
          <div><strong>Log out</strong><small>Exit session</small></div>
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
        <span>{application.company} · {application.position}</span>
      </div>
      <StatusBadge status={application.status} />
    </button>
  );
}

function MobileApplicationsPage({ applications, onOpenApplication, onOpenEditApplication, onStatusChange, onDelete, onExport, categoryOptions, levelOptions }: { applications: JobApplication[]; onOpenApplication: () => void; onOpenEditApplication: (app: JobApplication) => void; onStatusChange: (id: EntityId, status: Status) => void; onDelete: (id: EntityId) => void; onExport: () => void; categoryOptions: string[]; levelOptions: string[] }) {
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
        {!filtered.length ? (
          <MobileEmptyState
            icon={Folder}
            title={applications.length ? 'No results' : 'No applications yet'}
            text={applications.length ? 'Try changing filters or add a new application.' : 'Add your first application to start tracking your search.'}
          />
        ) : null}
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
              <span>{application.location} · {application.workMode}</span>
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
    <MobileBottomSheet title="Application details" subtitle={`${application.company} · ${application.position}`} onClose={onClose} className="mobile-application-details-sheet">
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

function MobileCalendarPage({ events, applications, setEvents, setToast, onSyncNotificationEvent, onDeleteNotificationEvent }: { events: CalendarEvent[]; applications: JobApplication[]; setEvents: (events: CalendarEvent[]) => void; setToast: (value: string) => void; onSyncNotificationEvent?: (event: CalendarEvent) => void; onDeleteNotificationEvent?: (id: number) => void }) {
  const [modal, setModal] = useState<CalendarEvent | null>(null);
  const sorted = events.map(normalizeCalendarEvent).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const grouped = sorted.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    acc[event.date] = acc[event.date] || [];
    acc[event.date].push(event);
    return acc;
  }, {});

  function save(event: CalendarEvent) {
    const normalized = normalizeCalendarEvent(event);
    if (events.some((item) => item.id === normalized.id)) setEvents(events.map((item) => item.id === normalized.id ? normalized : item));
    else setEvents([normalized, ...events]);
    setModal(null);
    setToast('Calendar event saved.');
    onSyncNotificationEvent?.(normalized);
  }

  function remove(id: number) {
    setEvents(events.filter((event) => event.id !== id));
    setToast('Calendar event removed.');
    onDeleteNotificationEvent?.(id);
  }

  function addEvent() {
    setModal({ id: 0, title: '', company: applications[0]?.company || '', applicationId: applications[0]?.id, date: today(), time: '10:00', endTime: '11:00', type: 'HR interview', location: 'Online', meetingLink: '', notes: '', icon: DEFAULT_EVENT_ICON, color: DEFAULT_EVENT_COLOR });
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
              <div className="mobile-calendar-event calendar-event-card" key={event.id} style={eventColorStyle(event)}>
                <button type="button" onClick={() => setModal(event)}>
                  <span className="mobile-calendar-icon"><EventIcon icon={event.icon} size={15} /></span>
                  <small className="mobile-calendar-time">{formatEventTime(event)}</small>
                  <div><strong>{event.title}</strong><small>{event.company} · {event.location}</small></div>
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
  const normalized = normalizeCalendarEvent(event);
  return (
    <div className="mobile-agenda-item calendar-event-card" style={eventColorStyle(normalized)}>
      <span><EventIcon icon={normalized.icon} size={15} /></span>
      <div>
        <strong>{event.title}</strong>
        <small>{formatEventTime(normalized)}</small>
        <small>{formatDate(event.date)} · {event.company}</small>
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
  const [isLoggedIn, setLoggedIn] = useState(() => Boolean(getAuthToken()));
  const [authLoading, setAuthLoading] = useState(() => Boolean(getAuthToken()));
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [applications, setApplications] = useState<JobApplication[]>(appInitialApplications);
  const [companies, setCompanies] = useState<Company[]>(appInitialCompanies);
  const [events, setEvents] = useState<CalendarEvent[]>(appInitialEvents);
  const [documents, setDocuments] = useState<DocumentItem[]>(appInitialDocuments);
  const [notes, setNotes] = useState<NoteItem[]>(appInitialNotes);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [page, setPage] = useState<Page>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<ProfileTab>('profile');
  const [editingApplication, setEditingApplication] = useState<JobApplication | null | undefined>(undefined);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [toast, setToast] = useState('');
  const applicationsApi = useApplications(isLoggedIn);
  const documentsApiState = useDocuments(isLoggedIn);
  const liveApplications = useMemo(
    () => applicationsApi.applications.map(apiApplicationToUi),
    [applicationsApi.applications]
  );
  const liveDocuments = useMemo(
    () => documentsApiState.documents.map(apiDocumentToUi),
    [documentsApiState.documents]
  );

  function clearWorkspaceState() {
    setProfile(initialProfile);
    setSettings(initialSettings);
    setApplications(appInitialApplications);
    setCompanies(appInitialCompanies);
    setEvents(appInitialEvents);
    setDocuments(appInitialDocuments);
    setNotes(appInitialNotes);
    setTheme(initialTheme);
    setSelectedApplication(null);
    setEditingApplication(undefined);
    setSettingsOpen(false);
  }

  function loadUserWorkspace(user: AuthUser) {
    const authProfile = profileFromAuthUser(user);
    const savedProfile = readUserStorage(user.id, STORAGE.profile, authProfile);
    const savedEvents = readUserStorage(user.id, STORAGE.events, appInitialEvents).map(normalizeCalendarEvent);
    const savedSettings = normalizeAppSettings(readUserStorage(user.id, STORAGE.settings, initialSettings));

    setAuthUser(user);
    setProfile({
      ...authProfile,
      ...savedProfile,
      email: user.email,
      name: savedProfile.name?.trim() || authProfile.name,
      avatarVariant: normalizeAvatarVariant(savedProfile.avatarVariant),
      avatarImage: savedProfile.avatarImage || ''
    });
    setSettings({
      ...savedSettings,
      notifications: {
        ...savedSettings.notifications,
        email: savedSettings.notifications.email || user.email
      }
    });
    setApplications(readUserStorage(user.id, STORAGE.applications, appInitialApplications));
    setCompanies(readUserStorage(user.id, STORAGE.companies, appInitialCompanies));
    setEvents(savedEvents);
    setDocuments(readUserStorage(user.id, STORAGE.documents, appInitialDocuments));
    setNotes(readUserStorage(user.id, STORAGE.notes, appInitialNotes));
    setTheme(normalizeTheme(readUserStorage(user.id, STORAGE.theme, initialTheme)));
    void syncNotificationEvents(savedEvents);
  }

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.profile, profile);
  }, [authUser, profile]);

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.settings, settings);
  }, [authUser, settings]);

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.applications, applications);
  }, [authUser, applications]);

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.companies, companies);
  }, [authUser, companies]);

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.events, events);
  }, [authUser, events]);

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.documents, documents);
  }, [authUser, documents]);

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.notes, notes);
  }, [authUser, notes]);

  useEffect(() => {
    if (!authUser) return;
    writeUserStorage(authUser.id, STORAGE.theme, theme);
  }, [authUser, theme]);

  useEffect(() => {
    if (!authUser || !isLoggedIn) return;

    let active = true;

    notificationsApi.getSettings()
      .then((dto) => {
        if (!active) return;
        setSettings((current) => applyNotificationSettingsDto(normalizeAppSettings(current), dto));
      })
      .catch((error) => {
        if (!active) return;
        setToast(error instanceof Error ? error.message : 'Notification settings could not be loaded.');
      });

    return () => {
      active = false;
    };
  }, [authUser?.id, isLoggedIn]);

  useEffect(() => {
    if (!authUser || !isLoggedIn) return;

    let active = true;
    const localEvents = readUserStorage(authUser.id, STORAGE.events, appInitialEvents).map(normalizeCalendarEvent);

    calendarEventsApi.getAll()
      .then((items) => {
        if (!active) return;
        const remoteEvents = items.map(calendarEventFromApi);

        if (remoteEvents.length || !localEvents.length) {
          setEvents(remoteEvents);
          return;
        }

        setEvents(localEvents);
        void syncNotificationEvents(localEvents);
      })
      .catch((error) => {
        if (!active) return;
        setToast(error instanceof Error ? error.message : 'Calendar events could not be loaded.');
      });

    return () => {
      active = false;
    };
  }, [authUser?.id, isLoggedIn]);

  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timeout); }, [toast]);

  useEffect(() => {
    clearSharedWorkspaceStorage();

    if (!getAuthToken()) {
      clearWorkspaceState();
      setAuthLoading(false);
      return;
    }

    authApi.me()
      .then((user) => {
        loadUserWorkspace(user);
        setLoggedIn(true);
      })
      .catch(() => {
        clearAuthToken();
        setAuthUser(null);
        clearWorkspaceState();
        setLoggedIn(false);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  async function login(input: LoginInput) {
    const response = await authApi.login(input);
    clearSharedWorkspaceStorage();
    loadUserWorkspace(response.user);
    setLoggedIn(true);
  }

  async function register(input: RegisterInput) {
    const response = await authApi.register(input);
    clearSharedWorkspaceStorage();
    loadUserWorkspace(response.user);
    setLoggedIn(true);
  }

  async function logout() {
    await authApi.logout();
    setAuthUser(null);
    setLoggedIn(false);
    clearWorkspaceState();
  }

  async function updateNotificationSettings(nextSettings: AppSettings, nextProfile: Profile) {
    const dto = await notificationsApi.updateSettings(notificationSettingsToApi(nextSettings, nextProfile));
    setSettings((current) => applyNotificationSettingsDto(normalizeAppSettings(current), dto));
    return dto;
  }

  async function saveNotificationSettings(nextSettings: AppSettings, nextProfile: Profile) {
    if (!authUser) return;

    try {
      await updateNotificationSettings(nextSettings, nextProfile);
      setToast('Notification settings saved.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Notification settings could not be saved.');
    }
  }

  async function sendNotificationTestEmail(nextSettings: AppSettings, nextProfile: Profile) {
    if (!authUser) return;

    try {
      await updateNotificationSettings(nextSettings, nextProfile);
      const response = await notificationsApi.sendTestEmail();
      setToast(response.message || 'Test email sent.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Test email could not be sent.');
    }
  }

  async function syncNotificationEvents(eventsForUser: CalendarEvent[], showErrors = false) {
    if (!getAuthToken() || !eventsForUser.length) return;

    const results = await Promise.allSettled(
      eventsForUser.map((event) => calendarEventsApi.upsert(calendarEventToApi(event)))
    );

    if (showErrors && results.some((result) => result.status === 'rejected')) {
      setToast('Calendar event could not be synced.');
    }
  }

  function syncNotificationEvent(event: CalendarEvent) {
    if (!getAuthToken()) return;

    void calendarEventsApi.upsert(calendarEventToApi(event))
      .then((savedEvent) => {
        const nextEvent = calendarEventFromApi(savedEvent);
        setEvents((current) => current.some((item) => item.id === nextEvent.id)
          ? current.map((item) => item.id === nextEvent.id ? nextEvent : item)
          : [nextEvent, ...current]);
      })
      .catch((error) => {
        setToast(error instanceof Error ? error.message : 'Calendar event could not be synced.');
      });
  }

  async function deleteNotificationEvent(id: number) {
    if (!getAuthToken()) return;

    try {
      await calendarEventsApi.remove(id);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Calendar event could not be removed.');
    }
  }

  function openSettings(tab: ProfileTab = 'profile') { setSettingsTab(tab); setSettingsOpen(true); }
  async function saveApplication(app: JobApplication) {
    try {
      const payload = uiApplicationToApi(app);
      const saved = editingApplication ? await applicationsApi.updateApplication(editingApplication.id, payload) : await applicationsApi.createApplication(payload);
      setSelectedApplication(apiApplicationToUi(saved));
      setEditingApplication(undefined);
      setPage('applications');
      setToast(editingApplication ? 'Application updated.' : 'Application added.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Application could not be saved.');
    }
  }
  async function updateStatus(id: EntityId, status: Status) {
    const application = liveApplications.find((app) => app.id === id);
    if (!application) return;
    try {
      const updated = await applicationsApi.updateApplication(id, uiApplicationToApi({ ...application, status, lastContact: application.lastContact || today() }));
      setSelectedApplication(apiApplicationToUi(updated));
      setToast('Status updated.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Status could not be updated.');
    }
  }
  async function deleteApplication(id: EntityId) {
    try {
      await applicationsApi.deleteApplication(id);
      if (selectedApplication?.id === id) setSelectedApplication(null);
      setToast('Application removed.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Application could not be removed.');
    }
  }
  async function uploadDocument(file: File) {
    await documentsApiState.uploadDocument(file);
  }
  async function createDocumentLink(doc: DocumentItem) {
    await documentsApiState.createLink({
      name: doc.name,
      url: doc.url,
      type: doc.type,
      category: doc.category,
      notes: doc.notes,
      tags: doc.tags?.length ? doc.tags : ['Link']
    });
  }
  async function saveCoverLetterDocument(input: SaveCoverLetterInput) {
    await documentsApi.createText({
      name: input.name,
      type: 'Cover letter',
      category: 'AI generated',
      content: input.content,
      language: input.language,
      targetRole: input.targetRole,
      notes: `Generated for ${input.companyName} - ${input.jobTitle}`,
      tags: ['AI', 'Cover letter']
    });
    await documentsApiState.loadDocuments();
  }
  async function archiveDocument(id: EntityId) {
    await documentsApiState.archiveDocument(id);
  }
  async function deleteDocument(id: EntityId) {
    await documentsApiState.deleteDocument(id);
  }
  async function downloadDocument(doc: DocumentItem) {
    const storedDocument = documentsApiState.documents.find((document) => document.id === doc.id);

    if (!storedDocument) {
      throw new Error('Document is no longer available.');
    }

    await documentsApiState.downloadDocument(storedDocument);
  }
  async function previewDocument(doc: DocumentItem) {
    const storedDocument = documentsApiState.documents.find((document) => document.id === doc.id);

    if (!storedDocument) {
      throw new Error('Document is no longer available.');
    }

    if (!storedDocument.fileName) {
      throw new Error('Saved links open in a new tab instead of the file preview.');
    }

    return documentsApiState.createDocumentPreviewUrl(storedDocument);
  }
  function resetWorkspace() {
    if (!confirm('Clear local companies, events, notes, settings and profile?')) return;
    setCompanies(appInitialCompanies);
    setEvents(appInitialEvents);
    setDocuments(appInitialDocuments);
    setNotes(appInitialNotes);
    setSettings(normalizeAppSettings(initialSettings));
    setProfile(authUser ? profileFromAuthUser(authUser) : initialProfile);
    setToast('Local workspace cleared.');
  }

  async function importApplicationsCsv(file: File) {
    try {
      const text = await readTextFile(file);
      const importedApplications = parseApplicationsCsv(text);

      if (!importedApplications.length) {
        setToast('No applications found in this CSV file.');
        return;
      }

      const confirmed = confirm(`Import ${importedApplications.length} applications from ${file.name}?`);
      if (!confirmed) return;

      let created = 0;
      let failed = 0;

      for (const application of importedApplications) {
        try {
          await applicationsApi.createApplication(uiApplicationToApi(application));
          created += 1;
        } catch {
          failed += 1;
        }
      }

      if (created) {
        await applicationsApi.loadApplications();
      }

      if (failed) {
        setToast(`Imported ${created} applications. ${failed} rows could not be saved.`);
      } else {
        setToast(`Imported ${created} applications.`);
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'CSV could not be imported.');
    }
  }

  function backup() { downloadJson('trackmycv-backup.json', { profile, settings, applications: liveApplications, companies, events, documents: liveDocuments, notes }, setToast); }
  const resolvedTheme = useResolvedTheme(theme);
  const shellClass = `app-shell theme-${theme} ${resolvedTheme === 'dark' ? 'dark' : ''} density-${settings.density.toLowerCase()} accent-${settings.accent.toLowerCase().replaceAll(' ', '-')} ${settings.animations ? 'animations-on' : 'animations-off'}`;
  const categoryOptions = uniqueOptions(categories, settings.preferences.categories);
  const levelOptions = uniqueOptions(levels, settings.preferences.levels);

  const isMobile = useIsMobile();

  if (authLoading) {
    return (
      <main className={`login-page ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
        <section className="login-card">
          <Logo />
          <div className="empty-state"><BriefcaseBusiness size={28} /><strong>Checking session</strong><span>Connecting to the local API.</span></div>
        </section>
      </main>
    );
  }

  if (!isLoggedIn) return <LoginPage onLogin={login} onRegister={register} resolvedTheme={resolvedTheme} />;

  const commonOverlays = (
    <>
      {settingsOpen ? <ProfileCustomizationModal profile={profile} setProfile={setProfile} settings={settings} setSettings={setSettings} activeTab={settingsTab} setActiveTab={setSettingsTab} theme={theme} setTheme={setTheme} onClose={() => setSettingsOpen(false)} onImportCsv={importApplicationsCsv} onExport={() => exportCsv(liveApplications, setToast)} onBackup={backup} onReset={resetWorkspace} onSaveSettings={saveNotificationSettings} onSendNotificationTest={sendNotificationTestEmail} /> : null}
      {editingApplication !== undefined ? <ApplicationModal application={editingApplication || undefined} companies={companies} documents={liveDocuments} categoryOptions={categoryOptions} levelOptions={levelOptions} onClose={() => setEditingApplication(undefined)} onSave={saveApplication} /> : null}
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
        resolvedTheme={resolvedTheme}
        setTheme={setTheme}
        settings={settings}
        applications={liveApplications}
        companies={companies}
        events={events}
        documents={liveDocuments}
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
        onExport={() => exportCsv(liveApplications, setToast)}
        documentsLoading={documentsApiState.loading}
        documentsError={documentsApiState.error}
        onRefreshDocuments={documentsApiState.loadDocuments}
        onUploadDocument={uploadDocument}
        onCreateDocumentLink={createDocumentLink}
        onDeleteDocument={deleteDocument}
        onArchiveDocument={archiveDocument}
        onDownloadDocument={downloadDocument}
        onPreviewDocument={previewDocument}
        onSaveCoverLetter={saveCoverLetterDocument}
        onSyncNotificationEvent={syncNotificationEvent}
        onDeleteNotificationEvent={deleteNotificationEvent}
        categoryOptions={categoryOptions}
        levelOptions={levelOptions}
      >
        {commonOverlays}
      </MobileLayout>
    );
  }

  return (
    <div className={shellClass}>
      <Sidebar page={page} setPage={setPage} applications={liveApplications} settings={settings} />
      <div className="workspace">
        <Topbar page={page} profile={profile} resolvedTheme={resolvedTheme} setTheme={setTheme} onOpenApplication={() => { setPage('applications'); setEditingApplication(null); }} onOpenSettings={openSettings} onLogout={logout} setPage={setPage} />
        <div className="content custom-scroll">
          {page === 'dashboard' ? <DashboardPage applications={liveApplications} events={events} setPage={setPage} /> : null}
          {page === 'applications' ? (
            applicationsApi.loading ? (
              <section className="page-section"><div className="panel-card empty-state"><BriefcaseBusiness size={28} /><strong>Loading applications</strong><span>Connecting to the backend API.</span></div></section>
            ) : applicationsApi.error ? (
              <section className="page-section"><div className="panel-card empty-state"><BriefcaseBusiness size={28} /><strong>Applications API unavailable</strong><span>{applicationsApi.error}</span><button className="secondary-button" type="button" onClick={applicationsApi.loadApplications}>Refresh</button></div></section>
            ) : (
              <ApplicationsPage applications={liveApplications} onOpenApplication={() => setEditingApplication(null)} onOpenEditApplication={(app) => setEditingApplication(app)} onStatusChange={updateStatus} onDelete={deleteApplication} selectedApplication={selectedApplication} setSelectedApplication={setSelectedApplication} onExport={() => exportCsv(liveApplications, setToast)} categoryOptions={categoryOptions} levelOptions={levelOptions} />
            )
          ) : null}
          {page === 'companies' ? <CompaniesPage companies={companies} applications={liveApplications} setCompanies={setCompanies} setToast={setToast} /> : null}
          {page === 'statistics' ? <StatisticsPage applications={liveApplications} categoryOptions={categoryOptions} /> : null}
          {page === 'calendar' ? <CalendarPage events={events} applications={liveApplications} setEvents={setEvents} setToast={setToast} onSyncNotificationEvent={syncNotificationEvent} onDeleteNotificationEvent={deleteNotificationEvent} /> : null}
          {page === 'documents' ? <DocumentsPage documents={liveDocuments} applications={liveApplications} setDocuments={setDocuments} onExport={() => exportCsv(liveApplications, setToast)} setToast={setToast} loading={documentsApiState.loading} error={documentsApiState.error} onRefresh={documentsApiState.loadDocuments} onUploadDocument={uploadDocument} onCreateDocumentLink={createDocumentLink} onDeleteDocument={deleteDocument} onArchiveDocument={archiveDocument} onDownloadDocument={downloadDocument} onPreviewDocument={previewDocument} /> : null}
          {page === 'ai' ? <AIToolsPage documents={liveDocuments} documentsLoading={documentsApiState.loading} onRefreshDocuments={documentsApiState.loadDocuments} setToast={setToast} onSaveCoverLetter={saveCoverLetterDocument} /> : null}
          {page === 'notes' ? <NotesPage notes={notes} setNotes={setNotes} setToast={setToast} /> : null}
        </div>
      </div>
      {commonOverlays}
    </div>
  );
}

export default App;

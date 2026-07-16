export type Page = 'dashboard' | 'applications' | 'companies' | 'statistics' | 'calendar' | 'documents' | 'notes';

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Confirmation received'
  | 'In progress'
  | 'HR interview'
  | 'Technical interview'
  | 'Interview'
  | 'Task / test'
  | 'Offer'
  | 'Rejected'
  | 'No response'
  | 'Ghosted'
  | 'Withdrawn'
  | 'Archived';

export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
export type ApplicationId = string | number;
export type DocumentStatus = 'Active' | 'Archived';
export type DocumentType =
  | 'CV'
  | 'Cover letter'
  | 'Portfolio'
  | 'GitHub'
  | 'Job offer'
  | 'Task description'
  | 'Recruiter email'
  | 'Certificate'
  | 'Other';
export type CalendarEventType = 'Interview' | 'HR interview' | 'Technical interview' | 'Follow-up' | 'Task deadline' | 'Online test' | 'Thank-you message';
export type CalendarEventStatus = 'upcoming' | 'done';
export type NoteType = 'Interview preparation' | 'Technical questions' | 'Company research' | 'Recruiter note' | 'Salary negotiation' | 'Follow-up' | 'General';
export type ContractType = 'UoP' | 'B2B' | 'Umowa zlecenie' | 'Internship' | 'Other';
export type Language = 'PL' | 'EN';

export interface SkillMatch {
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
}

export interface JobOfferArchive {
  offerUrl: string;
  savedJobDescription: string;
  requirements: string[];
  benefits: string[];
  techStack: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  contractType?: ContractType;
  archivedAt?: string;
}

export interface ApplicationReminder {
  id: number;
  applicationId: ApplicationId;
  title: string;
  dueDate: string;
  type: CalendarEventType;
  done: boolean;
}

export interface ApplicationStatusHistoryItem {
  id: number;
  applicationId: ApplicationId;
  status: ApplicationStatus;
  label: string;
  date: string;
  note: string;
}

export interface Recruiter {
  id: number;
  name: string;
  email: string;
  linkedInUrl: string;
  company: string;
  lastContact: string;
  notes: string;
  assignedApplicationIds: ApplicationId[];
}

export interface InterviewPreparation {
  applicationId: ApplicationId;
  questionsToPrepare: string[];
  companyNotes: string;
  recruiterName: string;
  technicalTopics: string[];
  salaryExpectations: string;
  myQuestionsToCompany: string[];
  checklist: { label: string; done: boolean }[];
}

export interface ApplicationDocument {
  id: number;
  applicationId: ApplicationId;
  documentId: ApplicationId;
  role: 'CV' | 'Cover letter' | 'Offer' | 'Task' | 'Certificate' | 'Other';
}

export interface JobApplication {
  id: ApplicationId;
  companyId?: string | null;
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
  requirements: string[];
  benefits: string[];
  notes: string;
  offerUrl: string;
  cv: string;
  coverLetter?: string;
  recruiterId?: number;
  recruiterName?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  contractType?: ContractType;
  techStack?: string[];
  savedJobDescription?: string;
  archivedAt?: string;
  skillMatch?: SkillMatch;
  assignedDocumentIds?: ApplicationId[];
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  location: string;
  website: string;
  applications: number;
  lastApplication: string;
  lastStatus: ApplicationStatus;
  responseRate: number;
  notes: string;
  activeApplications?: number;
  recruiters?: number[];
  contactHistory?: { date: string; label: string; note: string }[];
}

export interface DocumentItem {
  id: ApplicationId;
  name: string;
  type: DocumentType;
  category: string;
  updated: string;
  usedIn: number;
  size: string;
  language?: Language;
  targetRole?: string;
  fileName?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  usedInApplicationsCount?: number;
  assignedApplications?: ApplicationId[];
  tags?: string[];
  status?: DocumentStatus;
  notes?: string;
  successRate?: number;
  lastUsedAt?: string;
  isDefault?: boolean;
}

export interface CvVariant extends DocumentItem {
  type: 'CV';
  language: Language;
  targetRole: string;
  fileName: string;
  lastUpdated: string;
  usedInApplicationsCount: number;
  successRate: number;
  tags: string[];
  isDefault: boolean;
  status: DocumentStatus;
}

export interface CoverLetterVariant extends DocumentItem {
  type: 'Cover letter';
  language: Language;
  targetRole: string;
  fileName: string;
  lastUpdated: string;
  usedInApplicationsCount: number;
  successRate: number;
  tags: string[];
  status: DocumentStatus;
}

export interface NoteItem {
  id: number;
  title: string;
  company: string;
  application: string;
  tag: string;
  tags?: string[];
  type?: NoteType;
  updated: string;
  lastEdited?: string;
  preview: string;
  body: string;
  pinned?: boolean;
  favorite?: boolean;
  applicationId?: ApplicationId;
  checklist?: { label: string; done: boolean }[];
}

export interface EmailTemplate {
  id: number;
  name: string;
  language: Language;
  category: string;
  subject: string;
  body: string;
  lastUsed: string;
  usageCount: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  company: string;
  date: string;
  time: string;
  type: CalendarEventType;
  applicationId?: ApplicationId;
  linkedApplication?: string;
  channel: 'Online' | 'On-site' | 'Phone' | 'Email';
  notes: string;
  status: CalendarEventStatus;
}

export interface ExportReportData {
  applicationsCount: number;
  responseRate: number;
  interviews: number;
  offers: number;
  bestCv: string;
  bestSource: string;
  commonMissingSkills: string[];
  salarySummary: string;
}

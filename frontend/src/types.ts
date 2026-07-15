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
}

export interface DocumentItem {
  id: number;
  name: string;
  type: string;
  category: string;
  updated: string;
  usedIn: number;
  size: string;
}

export interface NoteItem {
  id: number;
  title: string;
  company: string;
  application: string;
  tag: string;
  updated: string;
  preview: string;
  body: string;
}

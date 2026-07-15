import { apiRequest } from './apiClient';
import type { ApplicationId, ApplicationStatus, JobApplication, WorkMode } from '../types';

type BackendEnumValue = number | string;

export interface JobApplicationDto {
  id: string;
  companyId: string | null;
  companyName: string;
  position: string;
  category: string;
  level: string;
  status: BackendEnumValue;
  dateApplied: string;
  lastContact: string | null;
  nextStep: string;
  location: string;
  workMode: BackendEnumValue;
  source: string;
  offerUrl: string;
  requirements: string;
  benefits: string;
  notes: string;
  cvName: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationUpsertInput = Omit<JobApplication, 'id'> & {
  id?: ApplicationId;
};

interface JobApplicationRequest {
  companyId: string | null;
  companyName: string;
  position: string;
  category: string;
  level: string;
  status: number;
  dateApplied: string;
  lastContact: string | null;
  nextStep: string;
  location: string;
  workMode: number;
  source: string;
  offerUrl: string;
  requirements: string;
  benefits: string;
  notes: string;
  cvName: string;
}

export const applicationStatusOptions: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'In progress',
  'Interview',
  'Task / test',
  'Offer',
  'Rejected',
  'No response',
  'Ghosted',
  'Archived'
];

export const workModeOptions: WorkMode[] = ['Remote', 'Hybrid', 'On-site'];

const statusByValue: Record<number, ApplicationStatus> = {
  0: 'Saved',
  1: 'Applied',
  2: 'In progress',
  3: 'Interview',
  4: 'Task / test',
  5: 'Offer',
  6: 'Rejected',
  7: 'No response',
  8: 'Ghosted',
  9: 'Archived'
};

const statusValueByLabel: Record<ApplicationStatus, number> = {
  Saved: 0,
  Applied: 1,
  'Confirmation received': 1,
  'In progress': 2,
  'HR interview': 3,
  'Technical interview': 3,
  Interview: 3,
  'Task / test': 4,
  Offer: 5,
  Rejected: 6,
  'No response': 7,
  Ghosted: 8,
  Withdrawn: 9,
  Archived: 9
};

const workModeByValue: Record<number, WorkMode> = {
  0: 'Remote',
  1: 'Hybrid',
  2: 'On-site'
};

const workModeValueByLabel: Record<WorkMode, number> = {
  Remote: 0,
  Hybrid: 1,
  'On-site': 2
};

const normalizedStatusByName: Record<string, ApplicationStatus> = {
  saved: 'Saved',
  applied: 'Applied',
  inprogress: 'In progress',
  interview: 'Interview',
  taskortest: 'Task / test',
  tasktest: 'Task / test',
  offer: 'Offer',
  rejected: 'Rejected',
  noresponse: 'No response',
  ghosted: 'Ghosted',
  archived: 'Archived'
};

const normalizedWorkModeByName: Record<string, WorkMode> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  'on site': 'On-site',
  'on-site': 'On-site'
};

const monthIndexes: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  sept: '09',
  oct: '10',
  nov: '11',
  dec: '12'
};

const normalizeEnumName = (value: string) => value.toLowerCase().replace(/[\s_/-]/g, '');

export function mapStatusFromApi(value: BackendEnumValue): ApplicationStatus {
  if (typeof value === 'number') {
    return statusByValue[value] ?? 'Saved';
  }

  return normalizedStatusByName[normalizeEnumName(value)] ?? 'Saved';
}

export function mapStatusToApi(status: ApplicationStatus): number {
  return statusValueByLabel[status];
}

export function mapWorkModeFromApi(value: BackendEnumValue): WorkMode {
  if (typeof value === 'number') {
    return workModeByValue[value] ?? 'Remote';
  }

  return normalizedWorkModeByName[value.toLowerCase()] ?? normalizedWorkModeByName[normalizeEnumName(value)] ?? 'Remote';
}

export function mapWorkModeToApi(workMode: WorkMode): number {
  return workModeValueByLabel[workMode];
}

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (items: string[]) => items.map((item) => item.trim()).filter(Boolean).join(', ');

export function formatDateForDisplay(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function toDateInputValue(value?: string | null): string {
  if (!value || value === '-') {
    return '';
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const displayMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (displayMatch) {
    const [, day, monthName, year] = displayMatch;
    const month = monthIndexes[monthName.toLowerCase()];

    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  return '';
}

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const toRequiredApiDate = (value: string) => toDateInputValue(value) || todayInputValue();

const toOptionalApiDate = (value: string) => toDateInputValue(value) || null;

export function mapApplicationFromApi(dto: JobApplicationDto): JobApplication {
  return {
    id: dto.id,
    companyId: dto.companyId,
    company: dto.companyName,
    position: dto.position,
    category: dto.category,
    level: dto.level,
    status: mapStatusFromApi(dto.status),
    dateApplied: formatDateForDisplay(dto.dateApplied),
    lastContact: formatDateForDisplay(dto.lastContact),
    nextStep: dto.nextStep,
    location: dto.location,
    workMode: mapWorkModeFromApi(dto.workMode),
    source: dto.source,
    requirements: splitList(dto.requirements),
    benefits: splitList(dto.benefits),
    notes: dto.notes,
    offerUrl: dto.offerUrl,
    cv: dto.cvName
  };
}

export function mapApplicationToApi(application: ApplicationUpsertInput): JobApplicationRequest {
  return {
    companyId: application.companyId ?? null,
    companyName: application.company,
    position: application.position,
    category: application.category,
    level: application.level,
    status: mapStatusToApi(application.status),
    dateApplied: toRequiredApiDate(application.dateApplied),
    lastContact: toOptionalApiDate(application.lastContact),
    nextStep: application.nextStep,
    location: application.location,
    workMode: mapWorkModeToApi(application.workMode),
    source: application.source,
    offerUrl: application.offerUrl,
    requirements: joinList(application.requirements),
    benefits: joinList(application.benefits),
    notes: application.notes,
    cvName: application.cv
  };
}

export const applicationsApi = {
  async getAll() {
    const data = await apiRequest<JobApplicationDto[]>('/api/applications');
    return data.map(mapApplicationFromApi);
  },

  async getById(id: ApplicationId) {
    const data = await apiRequest<JobApplicationDto>(`/api/applications/${id}`);
    return mapApplicationFromApi(data);
  },

  async create(application: ApplicationUpsertInput) {
    const data = await apiRequest<JobApplicationDto>('/api/applications', {
      method: 'POST',
      body: mapApplicationToApi(application)
    });

    return mapApplicationFromApi(data);
  },

  async update(id: ApplicationId, application: ApplicationUpsertInput) {
    await apiRequest<void>(`/api/applications/${id}`, {
      method: 'PUT',
      body: mapApplicationToApi(application)
    });
  },

  async remove(id: ApplicationId) {
    await apiRequest<void>(`/api/applications/${id}`, {
      method: 'DELETE'
    });
  }
};

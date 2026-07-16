import type {
  ApplicationDocument,
  ApplicationReminder,
  ApplicationStatusHistoryItem,
  CalendarEvent,
  Company,
  DocumentItem,
  EmailTemplate,
  InterviewPreparation,
  JobApplication,
  NoteItem,
  Recruiter
} from './types';

export const demoToday = '2026-07-15';

export const applications: JobApplication[] = [
  {
    id: 1,
    company: 'Northstar Labs',
    position: '.NET Developer Intern',
    category: '.NET',
    level: 'Internship',
    status: 'Interview',
    dateApplied: '2 Jul 2026',
    lastContact: '12 Jul 2026',
    nextStep: 'Technical interview',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'LinkedIn',
    requirements: ['C#', 'ASP.NET Core', 'SQL Server', 'REST API', 'Git'],
    benefits: ['Hybrid work', 'Mentoring', 'Training budget'],
    notes: 'Strong .NET internship fit. Prepare EF Core and DI examples.',
    offerUrl: 'https://careers.northstarlabs.example/dotnet-intern',
    cv: 'CV_NET_Intern_Demo.pdf',
    coverLetter: 'Cover_Letter_NET_Demo.pdf',
    recruiterId: 1,
    recruiterName: 'Anna Kowalska',
    salaryMin: 4500,
    salaryMax: 6200,
    currency: 'PLN',
    contractType: 'Internship',
    techStack: ['C#', 'ASP.NET Core', 'EF Core', 'SQL Server', 'Azure'],
    savedJobDescription: 'Internship focused on backend APIs, integrations and internal tooling.',
    archivedAt: '2 Jul 2026',
    assignedDocumentIds: [1, 5, 8],
    skillMatch: {
      requiredSkills: ['C#', 'ASP.NET Core', 'SQL Server', 'Azure', 'Docker'],
      matchedSkills: ['C#', 'ASP.NET Core', 'SQL Server'],
      missingSkills: ['Azure', 'Docker'],
      matchScore: 78
    }
  },
  {
    id: 2,
    company: 'Riverstone Consulting',
    position: 'Cyber Security Analyst Intern',
    category: 'Cybersecurity',
    level: 'Internship',
    status: 'In progress',
    dateApplied: '5 Jul 2026',
    lastContact: '11 Jul 2026',
    nextStep: 'HR screening',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'Company website',
    requirements: ['Security basics', 'IAM', 'English', 'Documentation'],
    benefits: ['Learning path', 'Consulting projects', 'Private healthcare'],
    notes: 'Prepare IAM lifecycle and business-risk examples.',
    offerUrl: 'https://riverstone.example/careers/security-analyst-intern',
    cv: 'CV_Security_Demo.pdf',
    coverLetter: 'Cover_Letter_Cybersecurity_Demo.pdf',
    recruiterId: 2,
    recruiterName: 'Marta Nowak',
    salaryMin: 4200,
    salaryMax: 5600,
    currency: 'PLN',
    contractType: 'Internship',
    techStack: ['IAM', 'Entra ID', 'SIEM', 'Risk assessment'],
    savedJobDescription: 'Security internship across IAM, documentation and basic incident handling.',
    archivedAt: '5 Jul 2026',
    assignedDocumentIds: [2, 6],
    skillMatch: {
      requiredSkills: ['IAM', 'Entra ID', 'Security basics', 'English', 'SOC'],
      matchedSkills: ['IAM', 'Security basics', 'English'],
      missingSkills: ['Entra ID', 'SOC'],
      matchScore: 72
    }
  },
  {
    id: 3,
    company: 'BrightPath Digital',
    position: 'IAM Intern',
    category: 'IAM',
    level: 'Internship',
    status: 'Applied',
    dateApplied: '8 Jul 2026',
    lastContact: '-',
    nextStep: 'Wait for response',
    location: 'Krakow',
    workMode: 'Remote',
    source: 'Just Join IT',
    requirements: ['Active Directory', 'Entra ID', 'MFA', 'Access reviews'],
    benefits: ['Remote work', 'Mentor support', 'Certification path'],
    notes: 'Good identity-focused internship for security track.',
    offerUrl: 'https://brightpath.example/jobs/iam-intern',
    cv: 'CV_IAM_Demo.pdf',
    coverLetter: 'Cover_Letter_Cybersecurity_Demo.pdf',
    recruiterId: 3,
    recruiterName: 'Piotr Zielinski',
    currency: 'PLN',
    contractType: 'Internship',
    techStack: ['Active Directory', 'Entra ID', 'MFA', 'PowerShell'],
    savedJobDescription: 'IAM intern role focused on access lifecycle, MFA and identity operations.',
    assignedDocumentIds: [4, 6, 10],
    skillMatch: {
      requiredSkills: ['Active Directory', 'Entra ID', 'MFA', 'PowerShell'],
      matchedSkills: ['Active Directory', 'MFA'],
      missingSkills: ['Entra ID', 'PowerShell'],
      matchScore: 68
    }
  },
  {
    id: 4,
    company: 'Cloudberry Systems',
    position: 'Junior DevOps Engineer',
    category: 'DevOps',
    level: 'Junior',
    status: 'Task / test',
    dateApplied: '1 Jul 2026',
    lastContact: '14 Jul 2026',
    nextStep: 'Submit Docker task',
    location: 'Remote',
    workMode: 'Remote',
    source: 'No Fluff Jobs',
    requirements: ['Docker', 'CI/CD', 'Linux', 'Kubernetes', 'Git'],
    benefits: ['Remote work', 'Cloud projects', 'Flexible hours'],
    notes: 'Task due tomorrow. Review GitHub Actions examples.',
    offerUrl: 'https://cloudberry.example/jobs/junior-devops',
    cv: 'CV_Fullstack_Demo.pdf',
    coverLetter: 'Cover_Letter_General_Demo.pdf',
    recruiterId: 4,
    recruiterName: 'Ewa Lewandowska',
    salaryMin: 6500,
    salaryMax: 9000,
    currency: 'PLN',
    contractType: 'B2B',
    techStack: ['Docker', 'GitHub Actions', 'Linux', 'Kubernetes'],
    savedJobDescription: 'Junior DevOps role working on containerized deployments and CI/CD.',
    archivedAt: '1 Jul 2026',
    assignedDocumentIds: [3, 9],
    skillMatch: {
      requiredSkills: ['Docker', 'CI/CD', 'Linux', 'Kubernetes'],
      matchedSkills: ['Docker', 'CI/CD', 'Linux'],
      missingSkills: ['Kubernetes'],
      matchScore: 81
    }
  },
  {
    id: 5,
    company: 'Oak & Code',
    position: 'Junior Full-stack Developer',
    category: 'Full-stack',
    level: 'Junior',
    status: 'Offer',
    dateApplied: '27 Jun 2026',
    lastContact: '13 Jul 2026',
    nextStep: 'Decision',
    location: 'Gdansk',
    workMode: 'Hybrid',
    source: 'Referral',
    requirements: ['React', 'C#', 'SQL', 'REST API'],
    benefits: ['Hybrid work', 'Workshops', 'English projects'],
    notes: 'Offer received. Compare salary and growth path.',
    offerUrl: 'https://oakcode.example/careers/fullstack-junior',
    cv: 'CV_Fullstack_Demo.pdf',
    coverLetter: 'Cover_Letter_NET_Demo.pdf',
    recruiterId: 5,
    recruiterName: 'Julia Wozniak',
    salaryMin: 7000,
    salaryMax: 8500,
    currency: 'PLN',
    contractType: 'UoP',
    techStack: ['React', 'C#', 'ASP.NET Core', 'SQL Server'],
    savedJobDescription: 'Full-stack role on internal SaaS products using React and .NET APIs.',
    archivedAt: '27 Jun 2026',
    assignedDocumentIds: [3, 5, 7],
    skillMatch: {
      requiredSkills: ['React', 'C#', 'ASP.NET Core', 'SQL Server'],
      matchedSkills: ['React', 'C#', 'SQL Server'],
      missingSkills: ['ASP.NET Core'],
      matchScore: 84
    }
  },
  {
    id: 6,
    company: 'Lumen Security',
    position: 'SOC Intern',
    category: 'SOC',
    level: 'Internship',
    status: 'Rejected',
    dateApplied: '21 Jun 2026',
    lastContact: '9 Jul 2026',
    nextStep: 'Closed',
    location: 'Wroclaw',
    workMode: 'On-site',
    source: 'Recruiter message',
    requirements: ['SIEM', 'Incident response', 'Networking', 'English'],
    benefits: ['SOC training', 'Shift allowance', 'Certifications'],
    notes: 'Feedback: strengthen networking and SIEM basics.',
    offerUrl: 'https://lumensecurity.example/jobs/soc-intern',
    cv: 'CV_Security_Demo.pdf',
    coverLetter: 'Cover_Letter_Cybersecurity_Demo.pdf',
    recruiterId: 6,
    recruiterName: 'Karol Maj',
    salaryMin: 4000,
    salaryMax: 5200,
    currency: 'PLN',
    contractType: 'Internship',
    techStack: ['SIEM', 'Windows logs', 'Networking', 'Incident response'],
    savedJobDescription: 'SOC internship with monitoring, triage and documentation responsibilities.',
    archivedAt: '21 Jun 2026',
    assignedDocumentIds: [2, 6],
    skillMatch: {
      requiredSkills: ['SIEM', 'Networking', 'Incident response', 'Windows logs'],
      matchedSkills: ['Incident response', 'Windows logs'],
      missingSkills: ['SIEM', 'Networking'],
      matchScore: 56
    }
  },
  {
    id: 7,
    company: 'MapleWorks',
    position: 'React Developer Intern',
    category: 'React',
    level: 'Internship',
    status: 'No response',
    dateApplied: '30 Jun 2026',
    lastContact: '-',
    nextStep: 'Follow-up',
    location: 'Poznan',
    workMode: 'Remote',
    source: 'Pracuj.pl',
    requirements: ['React', 'TypeScript', 'React Query', 'CSS'],
    benefits: ['Remote work', 'Product team', 'Mentoring'],
    notes: 'Follow-up due today.',
    offerUrl: 'https://mapleworks.example/jobs/react-intern',
    cv: 'CV_English_Demo.pdf',
    coverLetter: 'Cover_Letter_General_Demo.pdf',
    recruiterId: 7,
    recruiterName: 'Nina Adamska',
    currency: 'PLN',
    contractType: 'Internship',
    techStack: ['React', 'TypeScript', 'React Query', 'CSS'],
    savedJobDescription: 'Frontend internship focused on React components, data fetching and UI polish.',
    assignedDocumentIds: [11, 7, 8],
    skillMatch: {
      requiredSkills: ['React', 'TypeScript', 'React Query', 'CSS'],
      matchedSkills: ['React', 'TypeScript', 'CSS'],
      missingSkills: ['React Query'],
      matchScore: 75
    }
  }
];

export const statusHistories: ApplicationStatusHistoryItem[] = [
  { id: 1, applicationId: 1, status: 'Saved', label: 'Saved offer', date: '1 Jul 2026', note: 'Offer archived from LinkedIn.' },
  { id: 2, applicationId: 1, status: 'Applied', label: 'Applied', date: '2 Jul 2026', note: 'CV_NET_Intern_Demo.pdf sent.' },
  { id: 3, applicationId: 1, status: 'HR interview', label: 'HR screening', date: '9 Jul 2026', note: 'Short call with recruiter.' },
  { id: 4, applicationId: 1, status: 'Interview', label: 'Technical interview scheduled', date: '12 Jul 2026', note: 'Prepare ASP.NET Core and SQL Server.' },
  { id: 5, applicationId: 2, status: 'Applied', label: 'Applied', date: '5 Jul 2026', note: 'Application sent via career page.' },
  { id: 6, applicationId: 2, status: 'In progress', label: 'Recruiter replied', date: '11 Jul 2026', note: 'HR screening requested.' },
  { id: 7, applicationId: 4, status: 'Applied', label: 'Applied', date: '1 Jul 2026', note: 'No Fluff Jobs application.' },
  { id: 8, applicationId: 4, status: 'Task / test', label: 'Task assigned', date: '14 Jul 2026', note: 'Docker task due 16 Jul.' },
  { id: 9, applicationId: 6, status: 'Applied', label: 'Applied', date: '21 Jun 2026', note: 'Recruiter message converted to application.' },
  { id: 10, applicationId: 6, status: 'Rejected', label: 'Rejected', date: '9 Jul 2026', note: 'Feedback: improve SIEM basics.' }
];

export const reminders: ApplicationReminder[] = [
  { id: 1, applicationId: 7, title: 'Send follow-up to MapleWorks', dueDate: '2026-07-15', type: 'Follow-up', done: false },
  { id: 2, applicationId: 4, title: 'Submit Cloudberry Docker task', dueDate: '2026-07-16', type: 'Task deadline', done: false },
  { id: 3, applicationId: 1, title: 'Send thank-you message after interview', dueDate: '2026-07-18', type: 'Thank-you message', done: false }
];

export const recruiters: Recruiter[] = [
  { id: 1, name: 'Anna Kowalska', email: 'anna.kowalska@northstarlabs.example', linkedInUrl: 'https://linkedin.com/in/anna-northstar', company: 'Northstar Labs', lastContact: '12 Jul 2026', notes: 'Friendly recruiter, asked about internship availability.', assignedApplicationIds: [1] },
  { id: 2, name: 'Marta Nowak', email: 'marta.nowak@riverstone.example', linkedInUrl: 'https://linkedin.com/in/marta-riverstone', company: 'Riverstone Consulting', lastContact: '11 Jul 2026', notes: 'Cybersecurity consulting team.', assignedApplicationIds: [2] },
  { id: 3, name: 'Piotr Zielinski', email: 'piotr.zielinski@brightpath.example', linkedInUrl: 'https://linkedin.com/in/piotr-brightpath', company: 'BrightPath Digital', lastContact: '8 Jul 2026', notes: 'IAM team contact.', assignedApplicationIds: [3] },
  { id: 4, name: 'Ewa Lewandowska', email: 'ewa.lewandowska@cloudberry.example', linkedInUrl: 'https://linkedin.com/in/ewa-cloudberry', company: 'Cloudberry Systems', lastContact: '14 Jul 2026', notes: 'Sent practical DevOps task.', assignedApplicationIds: [4] },
  { id: 5, name: 'Julia Wozniak', email: 'julia.wozniak@oakcode.example', linkedInUrl: 'https://linkedin.com/in/julia-oakcode', company: 'Oak & Code', lastContact: '13 Jul 2026', notes: 'Offer discussion pending.', assignedApplicationIds: [5] },
  { id: 6, name: 'Karol Maj', email: 'karol.maj@lumensecurity.example', linkedInUrl: 'https://linkedin.com/in/karol-lumen', company: 'Lumen Security', lastContact: '9 Jul 2026', notes: 'Provided useful rejection feedback.', assignedApplicationIds: [6] },
  { id: 7, name: 'Nina Adamska', email: 'nina.adamska@mapleworks.example', linkedInUrl: 'https://linkedin.com/in/nina-mapleworks', company: 'MapleWorks', lastContact: '30 Jun 2026', notes: 'No response yet.', assignedApplicationIds: [7] }
];

export const companies: Company[] = [
  { id: 1, name: 'Northstar Labs', industry: 'SaaS / Technology', location: 'Warsaw', website: 'northstarlabs.example', applications: 1, activeApplications: 1, lastApplication: '2 Jul 2026', lastStatus: 'Interview', responseRate: 100, notes: 'Backend-heavy product company with .NET stack.', recruiters: [1], contactHistory: [{ date: '12 Jul 2026', label: 'Interview scheduled', note: 'Technical call confirmed.' }] },
  { id: 2, name: 'Riverstone Consulting', industry: 'Consulting', location: 'Warsaw', website: 'riverstone.example', applications: 1, activeApplications: 1, lastApplication: '5 Jul 2026', lastStatus: 'In progress', responseRate: 100, notes: 'Cybersecurity and IAM consulting projects.', recruiters: [2], contactHistory: [{ date: '11 Jul 2026', label: 'Recruiter reply', note: 'HR screening requested.' }] },
  { id: 3, name: 'BrightPath Digital', industry: 'Digital services', location: 'Krakow', website: 'brightpath.example', applications: 1, activeApplications: 1, lastApplication: '8 Jul 2026', lastStatus: 'Applied', responseRate: 0, notes: 'Identity and access management role.', recruiters: [3], contactHistory: [{ date: '8 Jul 2026', label: 'Applied', note: 'IAM application sent.' }] },
  { id: 4, name: 'Cloudberry Systems', industry: 'Cloud infrastructure', location: 'Remote', website: 'cloudberry.example', applications: 1, activeApplications: 1, lastApplication: '1 Jul 2026', lastStatus: 'Task / test', responseRate: 100, notes: 'DevOps role with Docker and CI/CD.', recruiters: [4], contactHistory: [{ date: '14 Jul 2026', label: 'Task assigned', note: 'Docker exercise due 16 Jul.' }] },
  { id: 5, name: 'Oak & Code', industry: 'Software house', location: 'Gdansk', website: 'oakcode.example', applications: 1, activeApplications: 1, lastApplication: '27 Jun 2026', lastStatus: 'Offer', responseRate: 100, notes: 'Full-stack role with offer on table.', recruiters: [5], contactHistory: [{ date: '13 Jul 2026', label: 'Offer received', note: 'Decision needed this week.' }] },
  { id: 6, name: 'Lumen Security', industry: 'Cybersecurity', location: 'Wroclaw', website: 'lumensecurity.example', applications: 1, activeApplications: 0, lastApplication: '21 Jun 2026', lastStatus: 'Rejected', responseRate: 100, notes: 'SOC internship, useful feedback.', recruiters: [6], contactHistory: [{ date: '9 Jul 2026', label: 'Rejected', note: 'Feedback shared by recruiter.' }] },
  { id: 7, name: 'MapleWorks', industry: 'Product studio', location: 'Poznan', website: 'mapleworks.example', applications: 1, activeApplications: 1, lastApplication: '30 Jun 2026', lastStatus: 'No response', responseRate: 0, notes: 'React internship, follow-up due.', recruiters: [7], contactHistory: [{ date: '30 Jun 2026', label: 'Applied', note: 'Application sent via Pracuj.pl.' }] }
];

export const documents: DocumentItem[] = [
  { id: 1, name: 'CV_NET_Intern_Demo.pdf', type: 'CV', category: '.NET', language: 'EN', targetRole: '.NET Intern', fileName: 'CV_NET_Intern_Demo.pdf', updated: '10 Jul 2026', updatedAt: '10 Jul 2026', createdAt: '22 Jun 2026', usedIn: 2, usedInApplicationsCount: 2, size: '420 KB', assignedApplications: [1], tags: ['C#', 'ASP.NET Core', 'SQL Server'], status: 'Active', notes: 'Default .NET internship CV.', successRate: 72, lastUsedAt: '2 Jul 2026', isDefault: true },
  { id: 2, name: 'CV_Security_Demo.pdf', type: 'CV', category: 'Cybersecurity', language: 'EN', targetRole: 'Security Intern', fileName: 'CV_Security_Demo.pdf', updated: '9 Jul 2026', updatedAt: '9 Jul 2026', createdAt: '18 Jun 2026', usedIn: 2, usedInApplicationsCount: 2, size: '436 KB', assignedApplications: [2, 6], tags: ['IAM', 'Security', 'SOC'], status: 'Active', notes: 'Security-focused CV with IAM projects.', successRate: 64, lastUsedAt: '5 Jul 2026' },
  { id: 3, name: 'CV_Fullstack_Demo.pdf', type: 'CV', category: 'Full-stack', language: 'EN', targetRole: 'Full-stack Junior', fileName: 'CV_Fullstack_Demo.pdf', updated: '8 Jul 2026', updatedAt: '8 Jul 2026', createdAt: '16 Jun 2026', usedIn: 2, usedInApplicationsCount: 2, size: '448 KB', assignedApplications: [4, 5], tags: ['React', 'C#', 'DevOps'], status: 'Active', notes: 'General full-stack CV.', successRate: 80, lastUsedAt: '1 Jul 2026' },
  { id: 4, name: 'CV_IAM_Demo.pdf', type: 'CV', category: 'IAM', language: 'EN', targetRole: 'IAM Intern', fileName: 'CV_IAM_Demo.pdf', updated: '11 Jul 2026', updatedAt: '11 Jul 2026', createdAt: '20 Jun 2026', usedIn: 1, usedInApplicationsCount: 1, size: '430 KB', assignedApplications: [3], tags: ['Entra ID', 'MFA', 'Access reviews'], status: 'Active', notes: 'IAM-specific version.', successRate: 55, lastUsedAt: '8 Jul 2026' },
  { id: 5, name: 'Cover_Letter_NET_Demo.pdf', type: 'Cover letter', category: '.NET', language: 'EN', targetRole: '.NET roles', fileName: 'Cover_Letter_NET_Demo.pdf', updated: '10 Jul 2026', updatedAt: '10 Jul 2026', createdAt: '21 Jun 2026', usedIn: 2, usedInApplicationsCount: 2, size: '198 KB', assignedApplications: [1, 5], tags: ['.NET', 'Internship'], status: 'Active', notes: 'Cover letter for .NET and full-stack roles.', successRate: 76, lastUsedAt: '2 Jul 2026' },
  { id: 6, name: 'Cover_Letter_Cybersecurity_Demo.pdf', type: 'Cover letter', category: 'Cybersecurity', language: 'EN', targetRole: 'Cybersecurity roles', fileName: 'Cover_Letter_Cybersecurity_Demo.pdf', updated: '9 Jul 2026', updatedAt: '9 Jul 2026', createdAt: '19 Jun 2026', usedIn: 3, usedInApplicationsCount: 3, size: '205 KB', assignedApplications: [2, 3, 6], tags: ['Security', 'IAM'], status: 'Active', notes: 'Security motivation and IAM angle.', successRate: 61, lastUsedAt: '8 Jul 2026' },
  { id: 7, name: 'Portfolio_Demo_Link', type: 'Portfolio', category: 'General', language: 'EN', targetRole: 'All IT roles', url: 'https://portfolio.example/demo', updated: '12 Jul 2026', updatedAt: '12 Jul 2026', createdAt: '1 Jun 2026', usedIn: 5, usedInApplicationsCount: 5, size: 'URL', assignedApplications: [1, 4, 5, 7], tags: ['Projects', 'React', '.NET'], status: 'Active', notes: 'Portfolio with projects and case studies.', successRate: 70, lastUsedAt: '8 Jul 2026' },
  { id: 8, name: 'GitHub_Demo_Profile', type: 'GitHub', category: 'General', language: 'EN', targetRole: 'All IT roles', url: 'https://github.com/demo-trackmycv', updated: '12 Jul 2026', updatedAt: '12 Jul 2026', createdAt: '1 Jun 2026', usedIn: 7, usedInApplicationsCount: 7, size: 'URL', assignedApplications: [1, 3, 4, 5, 7], tags: ['GitHub', 'Projects'], status: 'Active', notes: 'Pinned repos for API, React and security labs.', successRate: 68, lastUsedAt: '8 Jul 2026' },
  { id: 9, name: 'Job_Offer_Commerzbank_NET.pdf', type: 'Job offer', category: '.NET', language: 'EN', targetRole: '.NET Developer', fileName: 'Job_Offer_Commerzbank_NET.pdf', updated: '6 Jul 2026', updatedAt: '6 Jul 2026', createdAt: '6 Jul 2026', usedIn: 0, usedInApplicationsCount: 0, size: '320 KB', assignedApplications: [], tags: ['Offer archive'], status: 'Archived', notes: 'Archived reference offer.', successRate: 0, lastUsedAt: '6 Jul 2026' },
  { id: 10, name: 'Task_Description_EY_IAM.pdf', type: 'Task description', category: 'IAM', language: 'EN', targetRole: 'IAM Intern', fileName: 'Task_Description_EY_IAM.pdf', updated: '7 Jul 2026', updatedAt: '7 Jul 2026', createdAt: '7 Jul 2026', usedIn: 1, usedInApplicationsCount: 1, size: '160 KB', assignedApplications: [3], tags: ['IAM task'], status: 'Active', notes: 'Practice task notes for IAM interviews.', successRate: 0, lastUsedAt: '8 Jul 2026' },
  { id: 11, name: 'CV_English_Demo.pdf', type: 'CV', category: 'General', language: 'EN', targetRole: 'Internship', fileName: 'CV_English_Demo.pdf', updated: '13 Jul 2026', updatedAt: '13 Jul 2026', createdAt: '25 Jun 2026', usedIn: 1, usedInApplicationsCount: 1, size: '412 KB', assignedApplications: [7], tags: ['React', 'English'], status: 'Active', notes: 'Broad English CV for internship applications.', successRate: 50, lastUsedAt: '30 Jun 2026' },
  { id: 12, name: 'CV_Polish_Demo.pdf', type: 'CV', category: 'General', language: 'PL', targetRole: 'Junior IT', fileName: 'CV_Polish_Demo.pdf', updated: '13 Jul 2026', updatedAt: '13 Jul 2026', createdAt: '25 Jun 2026', usedIn: 0, usedInApplicationsCount: 0, size: '409 KB', assignedApplications: [], tags: ['PL', 'Junior'], status: 'Active', notes: 'Polish CV version for local postings.', successRate: 0, lastUsedAt: '-' },
  { id: 13, name: 'Certificate_Erasmus_BIP.pdf', type: 'Certificate', category: 'Education', language: 'EN', targetRole: 'All IT roles', fileName: 'Certificate_Erasmus_BIP.pdf', updated: '1 Jul 2026', updatedAt: '1 Jul 2026', createdAt: '1 Jul 2026', usedIn: 1, usedInApplicationsCount: 1, size: '280 KB', assignedApplications: [2], tags: ['Certificate', 'International'], status: 'Active', notes: 'Certificate used in security consulting applications.', successRate: 0, lastUsedAt: '5 Jul 2026' }
];

export const applicationDocuments: ApplicationDocument[] = documents.flatMap((document) =>
  (document.assignedApplications ?? []).map((applicationId, index) => ({
    id: (typeof document.id === 'number' ? document.id : index + 1) * 100 + index,
    applicationId,
    documentId: document.id,
    role: document.type === 'CV' ? 'CV' : document.type === 'Cover letter' ? 'Cover letter' : document.type === 'Job offer' ? 'Offer' : document.type === 'Task description' ? 'Task' : 'Other'
  }))
);

export const notes: NoteItem[] = [
  {
    id: 1,
    title: 'Northstar Labs - HR interview preparation',
    company: 'Northstar Labs',
    application: '.NET Developer Intern',
    applicationId: 1,
    tag: 'Interview preparation',
    tags: ['HR', '.NET', 'Motivation'],
    type: 'Interview preparation',
    updated: '14 Jul 2026',
    lastEdited: '14 Jul 2026',
    preview: 'Prepare motivation, availability and .NET learning story.',
    body: 'Talk about backend APIs, TrackMyCV project, EF Core migrations and why internship is a good fit. Prepare examples of teamwork and learning fast.',
    pinned: true,
    favorite: true,
    checklist: [
      { label: 'Prepare intro pitch', done: true },
      { label: 'Review company page', done: true },
      { label: 'Write 3 questions', done: false }
    ]
  },
  {
    id: 2,
    title: '.NET technical questions',
    company: 'Northstar Labs',
    application: '.NET Developer Intern',
    applicationId: 1,
    tag: 'Technical questions',
    tags: ['C#', 'ASP.NET Core', 'SQL'],
    type: 'Technical questions',
    updated: '14 Jul 2026',
    lastEdited: '14 Jul 2026',
    preview: 'DI, async/await, EF Core, REST API and SQL basics.',
    body: 'Revise dependency injection lifetimes, async/await, IQueryable vs IEnumerable, migrations, model validation, HTTP status codes and SQL joins.',
    pinned: true,
    favorite: false,
    checklist: [
      { label: 'Revise DI lifetimes', done: true },
      { label: 'Practice SQL joins', done: false },
      { label: 'Review API status codes', done: true }
    ]
  },
  {
    id: 3,
    title: 'Security topics to revise',
    company: 'Riverstone Consulting',
    application: 'Cyber Security Analyst Intern',
    applicationId: 2,
    tag: 'Security',
    tags: ['IAM', 'SOC', 'Risk'],
    type: 'Technical questions',
    updated: '13 Jul 2026',
    lastEdited: '13 Jul 2026',
    preview: 'Security basics, IAM lifecycle, MFA, risk and documentation.',
    body: 'Prepare authentication vs authorization, least privilege, identity lifecycle, incident triage basics and business-friendly communication examples.',
    pinned: false,
    favorite: true,
    checklist: [
      { label: 'Review IAM lifecycle', done: true },
      { label: 'Revise MFA and Conditional Access', done: false }
    ]
  },
  {
    id: 4,
    title: 'IAM interview notes',
    company: 'BrightPath Digital',
    application: 'IAM Intern',
    applicationId: 3,
    tag: 'IAM',
    tags: ['Entra ID', 'MFA', 'Access reviews'],
    type: 'Company research',
    updated: '12 Jul 2026',
    lastEdited: '12 Jul 2026',
    preview: 'Identity governance, access reviews and MFA examples.',
    body: 'Mention interest in identity governance. Prepare small explanation of joiner-mover-leaver process and access review purpose.',
    pinned: false,
    favorite: false,
    checklist: [
      { label: 'Prepare JML example', done: true },
      { label: 'Review Entra ID basics', done: false }
    ]
  },
  {
    id: 5,
    title: 'Questions to recruiter',
    company: 'Oak & Code',
    application: 'Junior Full-stack Developer',
    applicationId: 5,
    tag: 'Recruiter note',
    tags: ['Offer', 'Questions'],
    type: 'Recruiter note',
    updated: '13 Jul 2026',
    lastEdited: '13 Jul 2026',
    preview: 'Ask about mentorship, salary review and stack ownership.',
    body: 'Questions: team seniority, mentoring plan, salary review date, production ownership, test coverage, remote policy.',
    pinned: false,
    favorite: true,
    checklist: [
      { label: 'Ask about mentoring', done: false },
      { label: 'Ask about salary review', done: false }
    ]
  },
  {
    id: 6,
    title: 'Salary expectations note',
    company: 'General',
    application: 'General',
    tag: 'Salary',
    tags: ['Salary', 'Negotiation'],
    type: 'Salary negotiation',
    updated: '11 Jul 2026',
    lastEdited: '11 Jul 2026',
    preview: 'Target ranges for internship, junior and B2B roles.',
    body: 'Internship: 4.5k-6k PLN gross. Junior UoP: 7k-9k PLN gross. Junior B2B: 8k-11k PLN net + VAT depending on scope.',
    pinned: true,
    favorite: true,
    checklist: [
      { label: 'Prepare minimum acceptable range', done: true },
      { label: 'Prepare benefit tradeoffs', done: false }
    ]
  }
];

export const interviewPreparations: InterviewPreparation[] = [
  {
    applicationId: 1,
    questionsToPrepare: ['Tell me about your TrackMyCV project', 'Explain dependency injection', 'How do you handle API errors?'],
    companyNotes: 'Northstar Labs builds SaaS workflow tools for European customers.',
    recruiterName: 'Anna Kowalska',
    technicalTopics: ['C#', 'ASP.NET Core', 'EF Core', 'SQL Server', 'REST APIs'],
    salaryExpectations: '4500-6200 PLN gross for internship.',
    myQuestionsToCompany: ['What will the intern own?', 'How is mentoring organized?', 'How often do you review code?'],
    checklist: [
      { label: 'Check company', done: true },
      { label: 'Review job description', done: true },
      { label: 'Prepare salary range', done: true },
      { label: 'Prepare 3 questions', done: false },
      { label: 'Review project portfolio', done: false }
    ]
  },
  {
    applicationId: 4,
    questionsToPrepare: ['Explain a Dockerfile', 'What is CI/CD?', 'How would you debug a failing pipeline?'],
    companyNotes: 'Cloudberry works with cloud deployment automation.',
    recruiterName: 'Ewa Lewandowska',
    technicalTopics: ['Docker', 'Linux', 'GitHub Actions', 'Kubernetes basics'],
    salaryExpectations: '6500-9000 PLN B2B depending on workload.',
    myQuestionsToCompany: ['Which cloud provider do you use?', 'Is on-call expected?', 'How are tasks reviewed?'],
    checklist: [
      { label: 'Check company', done: true },
      { label: 'Review job description', done: true },
      { label: 'Prepare salary range', done: false },
      { label: 'Prepare 3 questions', done: false },
      { label: 'Review project portfolio', done: true }
    ]
  }
];

export const calendarEvents: CalendarEvent[] = [
  { id: 1, title: 'Technical interview', company: 'Northstar Labs', linkedApplication: '.NET Developer Intern', applicationId: 1, date: '2026-07-17', time: '10:00', type: 'Technical interview', channel: 'Online', notes: 'Teams call. Prepare API project walkthrough.', status: 'upcoming' },
  { id: 2, title: 'Submit Docker task', company: 'Cloudberry Systems', linkedApplication: 'Junior DevOps Engineer', applicationId: 4, date: '2026-07-16', time: '18:00', type: 'Task deadline', channel: 'Email', notes: 'Send GitHub repository link and short README.', status: 'upcoming' },
  { id: 3, title: 'Follow-up email', company: 'MapleWorks', linkedApplication: 'React Developer Intern', applicationId: 7, date: '2026-07-15', time: '09:00', type: 'Follow-up', channel: 'Email', notes: 'Polite follow-up after no response.', status: 'upcoming' },
  { id: 4, title: 'HR screening', company: 'Riverstone Consulting', linkedApplication: 'Cyber Security Analyst Intern', applicationId: 2, date: '2026-07-18', time: '14:30', type: 'HR interview', channel: 'Phone', notes: 'Discuss motivation and availability.', status: 'upcoming' },
  { id: 5, title: 'Thank-you message', company: 'Northstar Labs', linkedApplication: '.NET Developer Intern', applicationId: 1, date: '2026-07-18', time: '16:00', type: 'Thank-you message', channel: 'Email', notes: 'Send short thank-you after technical interview.', status: 'upcoming' },
  { id: 6, title: 'Online IAM test', company: 'BrightPath Digital', linkedApplication: 'IAM Intern', applicationId: 3, date: '2026-07-22', time: '12:00', type: 'Online test', channel: 'Online', notes: 'Identity basics and access lifecycle quiz.', status: 'upcoming' },
  { id: 7, title: 'Offer decision', company: 'Oak & Code', linkedApplication: 'Junior Full-stack Developer', applicationId: 5, date: '2026-07-20', time: '11:00', type: 'Follow-up', channel: 'Email', notes: 'Reply with decision or negotiation questions.', status: 'upcoming' },
  { id: 8, title: 'SOC recruiter feedback', company: 'Lumen Security', linkedApplication: 'SOC Intern', applicationId: 6, date: '2026-07-09', time: '15:00', type: 'Follow-up', channel: 'Phone', notes: 'Feedback call completed.', status: 'done' }
];

export const upcomingEvents = calendarEvents
  .filter((event) => event.status === 'upcoming' && event.date >= demoToday)
  .sort((first, second) => `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`));

export const emailTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Follow-up after no response',
    language: 'EN',
    category: 'Follow-up',
    subject: 'Follow-up regarding my application',
    body: 'Hello, I wanted to kindly follow up on my application for the role. I remain very interested in the opportunity and would be happy to provide any additional information.',
    lastUsed: '12 Jul 2026',
    usageCount: 4
  },
  {
    id: 2,
    name: 'Thank you after interview',
    language: 'EN',
    category: 'Interview',
    subject: 'Thank you for today\'s conversation',
    body: 'Hello, thank you for today\'s conversation and for sharing more context about the role. I enjoyed learning about the team and remain very interested in the opportunity.',
    lastUsed: '10 Jul 2026',
    usageCount: 2
  },
  {
    id: 3,
    name: 'Ask about feedback',
    language: 'EN',
    category: 'Feedback',
    subject: 'Request for feedback',
    body: 'Hello, thank you for updating me about the process. If possible, I would be grateful for short feedback that could help me improve for future opportunities.',
    lastUsed: '9 Jul 2026',
    usageCount: 1
  },
  {
    id: 4,
    name: 'Zapytanie o widełki',
    language: 'PL',
    category: 'Salary',
    subject: 'Pytanie o widełki wynagrodzenia',
    body: 'Dzień dobry, dziękuję za kontakt. Czy mogliby Państwo podzielić się informacją o planowanych widełkach wynagrodzenia dla tej roli?',
    lastUsed: '8 Jul 2026',
    usageCount: 3
  },
  {
    id: 5,
    name: 'Reject offer politely',
    language: 'EN',
    category: 'Offer',
    subject: 'Thank you for the offer',
    body: 'Hello, thank you very much for the offer and the time invested in the process. After careful consideration, I decided to accept another opportunity that better matches my current plans.',
    lastUsed: '6 Jul 2026',
    usageCount: 1
  }
];

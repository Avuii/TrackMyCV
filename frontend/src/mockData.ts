import type { Company, DocumentItem, JobApplication, NoteItem } from './types';

export const applications: JobApplication[] = [
  {
    id: 1,
    company: 'Microsoft',
    position: '.NET Developer Intern',
    category: '.NET',
    level: 'Intern',
    status: 'Interview',
    dateApplied: '20 May 2026',
    lastContact: '22 May 2026',
    nextStep: 'Technical interview',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'LinkedIn',
    requirements: ['C#', '.NET', 'SQL', 'REST API'],
    benefits: ['Hybrid work', 'Mentoring', 'Training budget'],
    notes: 'Revise async/await, DI and EF Core before interview.',
    offerUrl: 'https://careers.microsoft.com',
    cv: 'CV_NET_Intern_2026.pdf'
  },
  {
    id: 2,
    company: 'Deloitte',
    position: 'Cyber Security Analyst',
    category: 'Cybersecurity',
    level: 'Junior',
    status: 'In progress',
    dateApplied: '18 May 2026',
    lastContact: '20 May 2026',
    nextStep: 'HR interview',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'Company career page',
    requirements: ['IAM', 'Security basics', 'English', 'Documentation'],
    benefits: ['Learning path', 'Consulting projects', 'Private healthcare'],
    notes: 'Prepare IAM, Entra ID and business motivation.',
    offerUrl: 'https://www.deloitte.com/careers',
    cv: 'CV_Cybersecurity_IAM_2026.pdf'
  },
  {
    id: 3,
    company: 'EY',
    position: 'IAM Intern',
    category: 'IAM',
    level: 'Intern',
    status: 'Applied',
    dateApplied: '15 May 2026',
    lastContact: '—',
    nextStep: 'Waiting',
    location: 'Warsaw',
    workMode: 'On-site',
    source: 'LinkedIn',
    requirements: ['Active Directory', 'Entra ID', 'MFA', 'Access management'],
    benefits: ['Office events', 'Training', 'Mentor support'],
    notes: 'Good match for IAM/cybersecurity direction.',
    offerUrl: 'https://ey.com/careers',
    cv: 'CV_Cybersecurity_IAM_2026.pdf'
  },
  {
    id: 4,
    company: 'Allegro',
    position: 'Junior DevOps',
    category: 'DevOps',
    level: 'Junior-friendly',
    status: 'No response',
    dateApplied: '10 May 2026',
    lastContact: '—',
    nextStep: 'Follow-up',
    location: 'Remote',
    workMode: 'Remote',
    source: 'Just Join IT',
    requirements: ['Docker', 'CI/CD', 'Linux', 'Git'],
    benefits: ['Remote work', 'Tech community', 'Flexible hours'],
    notes: 'Consider sending follow-up after 14 days.',
    offerUrl: 'https://jobs.allegro.eu',
    cv: 'CV_General_IT_2026.pdf'
  },
  {
    id: 5,
    company: 'Netguru',
    position: '.NET Developer',
    category: '.NET',
    level: 'Junior',
    status: 'Rejected',
    dateApplied: '5 May 2026',
    lastContact: '12 May 2026',
    nextStep: 'Closed',
    location: 'Remote',
    workMode: 'Remote',
    source: 'Pracuj.pl',
    requirements: ['C#', '.NET', 'EF Core', 'Testing'],
    benefits: ['Remote-first', 'English projects', 'Workshops'],
    notes: 'Feedback: improve C# fundamentals and EF Core.',
    offerUrl: 'https://www.netguru.com/career',
    cv: 'CV_NET_Intern_2026.pdf'
  },
  {
    id: 6,
    company: 'Comarch',
    position: 'Junior Full-stack Developer',
    category: 'Full-stack',
    level: 'Junior',
    status: 'Ghosted',
    dateApplied: '2 May 2026',
    lastContact: '—',
    nextStep: 'Archive or follow-up',
    location: 'Łódź',
    workMode: 'Hybrid',
    source: 'Pracuj.pl',
    requirements: ['C#', 'React', 'SQL', 'Git'],
    benefits: ['Hybrid work', 'Training', 'Team projects'],
    notes: 'No response after 30 days.',
    offerUrl: 'https://kariera.comarch.pl',
    cv: 'CV_Fullstack_React_NET.pdf'
  },
  {
    id: 7,
    company: 'Accenture',
    position: 'Security Internship',
    category: 'Cybersecurity',
    level: 'Internship',
    status: 'Offer',
    dateApplied: '28 Apr 2026',
    lastContact: '7 May 2026',
    nextStep: 'Decision',
    location: 'Warsaw',
    workMode: 'Hybrid',
    source: 'Company career page',
    requirements: ['Security basics', 'Cloud', 'English'],
    benefits: ['Global projects', 'Mentoring', 'Certifications'],
    notes: 'Strong match with cybersecurity path.',
    offerUrl: 'https://www.accenture.com/careers',
    cv: 'CV_Cybersecurity_IAM_2026.pdf'
  }
];

export const companies: Company[] = [
  { id: 1, name: 'Microsoft', industry: 'Technology', location: 'Warsaw', website: 'microsoft.com', applications: 2, lastApplication: '20 May 2026', lastStatus: 'Interview', responseRate: 100, notes: 'Strong .NET match.' },
  { id: 2, name: 'Deloitte', industry: 'Consulting', location: 'Warsaw', website: 'deloitte.com', applications: 2, lastApplication: '18 May 2026', lastStatus: 'In progress', responseRate: 50, notes: 'Cybersecurity and IAM roles.' },
  { id: 3, name: 'EY', industry: 'Consulting', location: 'Warsaw', website: 'ey.com', applications: 1, lastApplication: '15 May 2026', lastStatus: 'Applied', responseRate: 0, notes: 'IAM-focused internship.' },
  { id: 4, name: 'Allegro', industry: 'E-commerce', location: 'Remote', website: 'allegro.eu', applications: 1, lastApplication: '10 May 2026', lastStatus: 'No response', responseRate: 0, notes: 'Follow-up recommended.' },
  { id: 5, name: 'Netguru', industry: 'Software house', location: 'Remote', website: 'netguru.com', applications: 1, lastApplication: '5 May 2026', lastStatus: 'Rejected', responseRate: 100, notes: 'Useful feedback received.' },
  { id: 6, name: 'Comarch', industry: 'Software', location: 'Łódź', website: 'comarch.pl', applications: 1, lastApplication: '2 May 2026', lastStatus: 'Ghosted', responseRate: 0, notes: 'No response.' }
];

export const documents: DocumentItem[] = [
  { id: 1, name: 'CV_NET_Intern_2026.pdf', type: 'CV', category: '.NET', updated: '18 May 2026', usedIn: 5, size: '420 KB' },
  { id: 2, name: 'CV_Cybersecurity_IAM_2026.pdf', type: 'CV', category: 'Cybersecurity', updated: '19 May 2026', usedIn: 4, size: '436 KB' },
  { id: 3, name: 'CV_Fullstack_React_NET.pdf', type: 'CV', category: 'Full-stack', updated: '12 May 2026', usedIn: 2, size: '448 KB' },
  { id: 4, name: 'Cover_Letter_Deloitte.pdf', type: 'Cover letter', category: 'Cybersecurity', updated: '18 May 2026', usedIn: 1, size: '198 KB' },
  { id: 5, name: 'Portfolio_Link', type: 'Portfolio', category: 'General', updated: '20 May 2026', usedIn: 7, size: 'URL' },
  { id: 6, name: 'GitHub_Profile', type: 'GitHub', category: 'General', updated: '20 May 2026', usedIn: 7, size: 'URL' }
];

export const notes: NoteItem[] = [
  {
    id: 1,
    title: 'Deloitte — HR interview preparation',
    company: 'Deloitte',
    application: 'Cyber Security Analyst',
    tag: 'Interview preparation',
    updated: '21 May 2026',
    preview: 'Prepare motivation, consulting angle and IAM basics.',
    body: 'Talk about developer background, interest in security, IAM and real business systems. Prepare answers about teamwork, English and learning mindset.'
  },
  {
    id: 2,
    title: 'EY — IAM topics to revise',
    company: 'EY',
    application: 'IAM Intern',
    tag: 'Technical questions',
    updated: '20 May 2026',
    preview: 'Active Directory, Entra ID, MFA, Conditional Access.',
    body: 'Revise identity lifecycle, authentication vs authorization, MFA, conditional access and basic AD structure.'
  },
  {
    id: 3,
    title: 'Microsoft — .NET technical questions',
    company: 'Microsoft',
    application: '.NET Developer Intern',
    tag: 'Technical questions',
    updated: '22 May 2026',
    preview: 'C#, DI, async/await, EF Core and REST API basics.',
    body: 'Review interfaces, dependency injection, async/await, IQueryable vs IEnumerable, try/catch/finally, EF Core migrations and REST endpoints.'
  },
  {
    id: 4,
    title: 'Follow-up message template',
    company: 'General',
    application: 'General',
    tag: 'Follow-up draft',
    updated: '19 May 2026',
    preview: 'Short polite message after no response.',
    body: 'Hello, I wanted to kindly follow up on my application for the role. I remain very interested in the opportunity and would be happy to provide any additional information.'
  }
];

export const upcomingEvents = [
  { id: 1, title: 'Technical interview', company: 'Microsoft', date: '28 May 2026', time: '10:00', type: 'Technical interview' },
  { id: 2, title: 'HR interview', company: 'Deloitte', date: '29 May 2026', time: '14:00', type: 'HR interview' },
  { id: 3, title: 'Follow-up', company: 'Allegro', date: '31 May 2026', time: '09:00', type: 'Follow-up reminder' },
  { id: 4, title: 'Online test', company: 'EY', date: '2 Jun 2026', time: '16:00', type: 'Online test' }
];

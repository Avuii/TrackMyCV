import { apiRequest } from './apiClient';

export type CvReviewRequest = {
  documentId: string;
  reviewType: 'general' | 'job-match';
  language: 'en' | 'pl';
  jobTitle?: string;
  experienceLevel?: string;
  jobDescription?: string;
};

export type CvIssue = {
  priority: string;
  title: string;
  description: string;
  section: string;
  suggestedFix: string;
};

export type CategoryScore = {
  name: string;
  score: number;
  note: string;
};

export type AtsCompatibility = {
  score: number;
  summary: string;
  improvements: string[];
};

export type SectionReview = {
  section: string;
  score: number;
  summary: string;
  suggestions: string[];
};

export type CvReviewResult = {
  overallScore: number;
  summary: string;
  strengths: string[];
  issues: CvIssue[];
  categoryScores: CategoryScore[];
  atsCompatibility: AtsCompatibility;
  missingKeywords: string[];
  sectionReviews: SectionReview[];
  recommendedActions: string[];
  jobMatchScore?: number | null;
};

export type CvReviewDto = {
  id: string;
  documentId: string;
  documentName: string;
  reviewType: string;
  language: string;
  jobTitle: string;
  experienceLevel: string;
  status: string;
  overallScore?: number | null;
  jobMatchScore?: number | null;
  createdAt: string;
  completedAt?: string | null;
  result?: CvReviewResult | null;
  errorMessage?: string | null;
};

export type CoverLetterGenerateRequest = {
  documentId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  language: 'en' | 'pl';
  tone: 'professional' | 'natural' | 'formal';
  length: 'short' | 'standard' | 'detailed';
  additionalContext?: string;
};

export type CoverLetterGenerateResponse = {
  coverLetter: string;
  suggestedFileName: string;
  warnings: string[];
};

export const aiApi = {
  createCvReview(input: CvReviewRequest) {
    return apiRequest<CvReviewDto>('/api/ai/cv-reviews', {
      method: 'POST',
      body: input
    });
  },

  getCvReviews() {
    return apiRequest<CvReviewDto[]>('/api/ai/cv-reviews');
  },

  getCvReview(id: string) {
    return apiRequest<CvReviewDto>(`/api/ai/cv-reviews/${encodeURIComponent(id)}`);
  },

  deleteCvReview(id: string) {
    return apiRequest<void>(`/api/ai/cv-reviews/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  generateCoverLetter(input: CoverLetterGenerateRequest) {
    return apiRequest<CoverLetterGenerateResponse>('/api/ai/cover-letters/generate', {
      method: 'POST',
      body: input
    });
  }
};

import { apiRequest } from './apiClient';

export type NotificationSettingsDto = {
  email: string;
  interviewReminders: boolean;
  followUpReminders: boolean;
  applicationDeadlines: boolean;
  weeklySummary: boolean;
  monthlyReport: boolean;
  reminderTime: string;
  emailConfigured: boolean;
};

export type NotificationSettingsRequest = Omit<NotificationSettingsDto, 'emailConfigured'>;

export type NotificationCalendarEventRequest = {
  clientEventId: string;
  title: string;
  company: string;
  applicationId?: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime?: string | null;
  location: string;
  meetingLink?: string;
  detailedPlan?: string;
  icon?: string;
  color?: string;
};

export type NotificationTestEmailResponse = {
  sent: boolean;
  message: string;
};

export const notificationsApi = {
  getSettings() {
    return apiRequest<NotificationSettingsDto>('/api/notifications/settings');
  },

  updateSettings(input: NotificationSettingsRequest) {
    return apiRequest<NotificationSettingsDto>('/api/notifications/settings', {
      method: 'PUT',
      body: input
    });
  },

  sendTestEmail() {
    return apiRequest<NotificationTestEmailResponse>('/api/notifications/test-email', {
      method: 'POST'
    });
  },

  upsertCalendarEvent(input: NotificationCalendarEventRequest) {
    return apiRequest<void>('/api/notifications/calendar-events', {
      method: 'POST',
      body: input
    });
  },

  deleteCalendarEvent(clientEventId: string | number) {
    return apiRequest<void>(`/api/notifications/calendar-events/${encodeURIComponent(String(clientEventId))}`, {
      method: 'DELETE'
    });
  }
};

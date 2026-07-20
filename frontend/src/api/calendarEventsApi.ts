import { apiRequest } from './apiClient';

export type CalendarEventDto = {
  clientEventId: string;
  title: string;
  company: string;
  applicationId: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime?: string | null;
  location: string;
  meetingLink: string;
  detailedPlan: string;
  icon: string;
  color: string;
};

export type CalendarEventRequest = CalendarEventDto;

export const calendarEventsApi = {
  getAll() {
    return apiRequest<CalendarEventDto[]>('/api/calendar-events');
  },

  upsert(input: CalendarEventRequest) {
    return apiRequest<CalendarEventDto>('/api/calendar-events', {
      method: 'POST',
      body: input
    });
  },

  update(clientEventId: string, input: CalendarEventRequest) {
    return apiRequest<CalendarEventDto>(`/api/calendar-events/${encodeURIComponent(clientEventId)}`, {
      method: 'PUT',
      body: input
    });
  },

  remove(clientEventId: string | number) {
    return apiRequest<void>(`/api/calendar-events/${encodeURIComponent(String(clientEventId))}`, {
      method: 'DELETE'
    });
  }
};

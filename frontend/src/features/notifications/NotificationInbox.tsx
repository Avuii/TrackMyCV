import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { apiRequest } from '../../api/apiClient';

type Notice = { id: string; title: string; detail: string; page: 'applications' | 'calendar'; applicationId?: string | null; read: boolean };

export function NotificationInbox({ navigate }: { navigate: (page: Notice['page'], applicationId?: string) => void }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const unread = items.filter(item => !item.read).length;

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      const now = new Date();
      const date = new Intl.DateTimeFormat('sv-SE').format(now);
      const time = new Intl.DateTimeFormat('en-GB', { timeStyle: 'short' }).format(now);
      const query = new URLSearchParams({ today: date, time });
      try {
        const notices = await apiRequest<Notice[]>('/api/inbox?' + query, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setItems(notices);
        setError('');
      } catch {
        if (!controller.signal.aborted) setError('Notifications are temporarily unavailable.');
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [open]);

  async function read(item: Notice) {
    try {
      if (!item.read) await apiRequest('/api/inbox/' + encodeURIComponent(item.id) + '/read', { method: 'PUT' });
      setItems(previous => previous.map(notice => notice.id === item.id ? { ...notice, read: true } : notice));
      navigate(item.page, item.applicationId ?? undefined);
      setOpen(false);
    } catch {
      setError('Could not mark this notification as read.');
    }
  }

  return (
    <div className="profile-wrap notification-inbox">
      <button className={unread ? 'icon-button with-dot' : 'icon-button'} type="button"
        aria-label={unread ? 'Notifications (' + unread + ' unread)' : 'Notifications'}
        aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <Bell size={19} />
      </button>
      {open && <section className="profile-menu notification-list" aria-label="Notifications">
        <div className="profile-menu-header"><strong>Notifications</strong></div>
        {error && <p role="status">{error}</p>}
        {!items.length && !error && <p>No upcoming events or follow-ups.</p>}
        {items.map(item => (
          <button key={item.id} type="button" className={item.read ? '' : 'unread'} onClick={() => void read(item)}>
            <span><strong>{item.title}</strong><small>{item.detail}</small></span>
          </button>
        ))}
      </section>}
    </div>
  );
}

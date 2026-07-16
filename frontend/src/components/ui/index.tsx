import { useEffect, type ComponentType } from 'react';
import { BriefcaseBusiness, CheckCircle2, X } from 'lucide-react';

export const statusClass = (status: string) =>
  status
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('/', '')
    .replaceAll('â€”', '')
    .replaceAll('received', 'received');

export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  return message ? <div className="toast-message">{message}</div> : null;
}

export function MetricCard({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone?: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${statusClass(status)}`}>{status}</span>;
}

export function CategoryPill({ category }: { category: string }) {
  return <span className="category-pill">{category}</span>;
}

export function MiniListCard({ icon: Icon, title, rows }: { icon: ComponentType<{ size?: number }>; title: string; rows: [string, string][] }) {
  return (
    <section className="panel-card mini-list-card">
      <div className="mini-title">
        <Icon size={17} />
        <h2>{title}</h2>
      </div>
      {rows.map(([label, value]) => (
        <div className="mini-row" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <button className="mini-link" type="button">View all</button>
    </section>
  );
}

export function InfoList({ title, items }: { title: string; items: string[] }) {
  const visibleItems = items.filter(Boolean);

  return (
    <div className="info-list">
      <h3>{title}</h3>
      <div>
        {visibleItems.length > 0 ? visibleItems.map((item, index) => <span key={`${item}-${index}`}>{item}</span>) : <span>-</span>}
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-title">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export function ApplicationsStateMessage({
  title,
  text,
  actionLabel,
  onAction
}: {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="modal-content">
      <div className="mini-title">
        <BriefcaseBusiness size={18} />
        <h2>{title}</h2>
      </div>
      <p>{text}</p>
      {actionLabel && onAction ? (
        <button className="secondary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ApplicationFormInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function SelectionTokenGroup<T extends string>({
  title,
  tokens,
  selected,
  onSelect
}: {
  title: string;
  tokens: T[];
  selected: T;
  onSelect: (token: T) => void;
}) {
  return (
    <div className="setting-group">
      <span className="setting-label">{title}</span>
      <div className="token-row">
        {tokens.map((token) => (
          <button className={selected === token ? 'selected' : ''} type="button" key={token} onClick={() => onSelect(token)}>
            {token}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ModalChrome({
  title,
  subtitle,
  children,
  footer,
  onClose,
  label = title
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  label?: string;
}) {
  return (
    <div className="modal-backdrop">
      <section className="settings-modal" role="dialog" aria-modal="true" aria-label={label}>
        <header className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label={`Close ${label}`}>
            <X size={20} />
          </button>
        </header>
        <main className="modal-content custom-scroll">{children}</main>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}

export function SaveButton({ saving }: { saving?: boolean }) {
  return (
    <button className="primary-button" type="submit" disabled={saving}>
      <CheckCircle2 size={17} /> {saving ? 'Saving...' : 'Save'}
    </button>
  );
}

import { useEffect, useState } from 'react';
import { apiRequest } from '../../../api/apiClient';

type Activity = { id: string; kind: string; detail: string; occurredAtUtc: string };
type Timeline = { createdAt: string; followUpDueOn: string | null; activity: Activity[] };
type Usage = Pick<Activity, 'id' | 'kind' | 'occurredAtUtc'> & { company: string; position: string };

const labels: Record<string, string> = {
  status: 'Status changed',
  contact: 'Last contact updated',
  'next-step': 'Next step updated',
  'document-linked': 'Document linked',
  'document-existing': 'Existing document link recorded',
  'document-unlinked': 'Document unlinked',
  'application-deleted': 'Linked application deleted'
};

function displayTimestamp(value: string) {
  const utc = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + 'Z';
  return new Date(utc).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function useHistory<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(undefined);
    setError(false);
    apiRequest<T>(path, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [path, attempt]);

  return { data, error, retry: () => setAttempt(value => value + 1) };
}

function HistoryStatus({ error, retry }: { error: boolean; retry: () => void }) {
  return error
    ? <div role="alert">Could not load history. <button className="text-button" type="button" onClick={retry}>Retry</button></div>
    : <p role="status">Loading history…</p>;
}

export function ApplicationTimeline({ applicationId, today }: { applicationId: string; today: string }) {
  const { data, error, retry } = useHistory<Timeline>(`/api/applications/${encodeURIComponent(applicationId)}/activity`);
  return <section className="timeline-card workspace-history">
    <h3>Application activity</h3>
    {!data ? <HistoryStatus error={error} retry={retry} /> : <>
      {data.followUpDueOn && (
        <p>{data.followUpDueOn <= today ? 'Follow-up suggested' : 'Follow-up suggested from'}{' '}
          <time dateTime={data.followUpDueOn}>{data.followUpDueOn}</time>.
          {data.followUpDueOn <= today && ' Check for a reply and send a short follow-up if you are still waiting.'}
        </p>
      )}
      <ul>
        {data.activity.map(entry => (
          <li key={entry.id}>
            <strong>{labels[entry.kind] ?? entry.kind}</strong>{entry.detail && ` · ${entry.detail}`}
            <small>{displayTimestamp(entry.occurredAtUtc)}</small>
          </li>
        ))}
        <li><strong>Application created</strong><small>{displayTimestamp(data.createdAt)}</small></li>
      </ul>
    </>}
  </section>;
}

export function DocumentUsageHistory({ documentId }: { documentId: string }) {
  const { data, error, retry } = useHistory<Usage[]>(`/api/documents/${encodeURIComponent(documentId)}/usage`);
  return <section className="assigned-applications panel-card workspace-history">
    <h3>Document usage history</h3>
    {!data ? <HistoryStatus error={error} retry={retry} /> : data.length ? (
      <ul>{data.map(entry => <li key={entry.id}>
        <strong>{entry.company} · {entry.position}</strong> · {labels[entry.kind] ?? entry.kind}
        <small>{displayTimestamp(entry.occurredAtUtc)}</small>
      </li>)}</ul>
    ) : <p>No recorded link changes.</p>}
  </section>;
}

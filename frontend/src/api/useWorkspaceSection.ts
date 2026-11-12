import { useEffect, useRef, useState } from 'react';
import { ApiResponseError, apiRequest } from './apiClient';

type Section<T> = { revision: string | null; data: T | null };

function mergeChanges(base: unknown, local: unknown, remote: unknown): unknown {
  if (JSON.stringify(base) === JSON.stringify(local)) return remote;
  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote) &&
      [...base, ...local, ...remote].every(item => item && typeof item === 'object' && 'id' in item)) {
    const original = new Map(base.map(item => [item.id, item]));
    const mine = new Map(local.map(item => [item.id, item]));
    const theirs = new Map(remote.map(item => [item.id, item]));
    return [...new Set([...mine.keys(), ...theirs.keys()])]
      .map(id => mergeChanges(original.get(id), mine.get(id), theirs.get(id)))
      .filter(item => item !== undefined);
  }

  const isObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  if (isObject(base) && isObject(local) && isObject(remote)) {
    return Object.fromEntries([...new Set([...Object.keys(local), ...Object.keys(remote)])]
      .map(key => [key, mergeChanges(base[key], local[key], remote[key])])
      .filter(([, value]) => value !== undefined));
  }
  return local;
}

export function useWorkspaceSection<T>(
  account: string | undefined,
  name: 'companies' | 'notes' | 'preferences' | 'scout' | 'preparation',
  value: T,
  apply: (value: T) => void,
  reportError: (message: string) => void
) {
  const current = useRef({ value, apply, reportError });
  current.current = { value, apply, reportError };
  const trigger = useRef<() => void>(() => undefined);
  const path = '/api/workspace/' + name;
  const [loadedAccount, setLoadedAccount] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setLoadedAccount(undefined);
    setError(undefined);
    if (!account) return;
    let snapshot: { revision: string | null; saved: string | null } | null = null;
    let lastRefresh = 0;
    let lastError = '';
    const controller = new AbortController();
    let saving = false;

    async function synchronize(refresh = false) {
      if (saving || controller.signal.aborted || !account) return;
      saving = true;
      try {
        const local = JSON.stringify(current.current.value);
        const refreshDue = refresh || Date.now() - lastRefresh >= 30000;
        if (!snapshot || (snapshot.saved === local && refreshDue)) {
          const remote = await apiRequest<Section<T>>(path, { signal: controller.signal });
          if (controller.signal.aborted) return;
          lastRefresh = Date.now();
          if (snapshot && JSON.stringify(current.current.value) !== local) return;
          const changed = remote.revision !== snapshot?.revision;
          snapshot = { revision: remote.revision, saved: remote.data === null ? null : JSON.stringify(remote.data) };
          if (remote.data !== null && changed) {
            current.current.apply(remote.data);
            setLoadedAccount(account);
            setError(undefined);
            return;
          }
          setLoadedAccount(account);
          setError(undefined);
        }

        const payload = current.current.value;
        const serialized = JSON.stringify(payload);
        if (snapshot.saved === serialized) return;
        const saved = await apiRequest<Section<T>>(path, {
          method: 'PUT',
          body: { revision: snapshot.revision, data: payload },
          signal: controller.signal
        });
        if (!controller.signal.aborted) {
          snapshot = { revision: saved.revision, saved: serialized };
          lastError = '';
          setError(undefined);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiResponseError && error.status === 409 && snapshot) {
          try {
            const remote = await apiRequest<Section<T>>(path, { signal: controller.signal });
            if (controller.signal.aborted) return;
            const local = current.current.value;
            const base = snapshot.saved === null
              ? (Array.isArray(local) ? [] : {})
              : JSON.parse(snapshot.saved);
            snapshot = { revision: remote.revision, saved: remote.data === null ? null : JSON.stringify(remote.data) };
            if (remote.data !== null) {
              current.current.apply(mergeChanges(base, local, remote.data) as T);
            }
            return;
          } catch {
            if (controller.signal.aborted) return;
          }
        }
        const message = error instanceof Error ? error.message : 'Workspace synchronization failed.';
        setError(message);
        if (message !== lastError) {
          lastError = message;
          current.current.reportError(message);
        }
      } finally {
        saving = false;
      }
    }

    void synchronize();
    const timer = window.setInterval(() => void synchronize(), 3000);
    trigger.current = () => void synchronize();
    const onFocus = () => void synchronize(true);
    window.addEventListener('focus', onFocus);
    return () => {
      controller.abort();
      trigger.current = () => undefined;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [account, path]);

  useEffect(() => {
    const timer = window.setTimeout(() => trigger.current(), 350);
    return () => window.clearTimeout(timer);
  }, [value]);

  return { ready: Boolean(account && loadedAccount === account), error, retry: () => trigger.current() };
}

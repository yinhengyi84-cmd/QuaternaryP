import { useCallback, useEffect, useRef, useState } from 'react';
import { parsePlayerAttributesSnapshot, type PlayerAttributesGateway, type PlayerAttributesSnapshot } from './player-attributes';

type AttributesState = {
  snapshot: PlayerAttributesSnapshot | null;
  loading: boolean;
  error: string;
};

export function usePlayerAttributes(gateway: PlayerAttributesGateway) {
  const [state, setState] = useState<AttributesState>({ snapshot: null, loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef<{ gateway: PlayerAttributesGateway; snapshot: PlayerAttributesSnapshot | null } | null>(null);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    let active = true;
    const previous = latest.current?.gateway === gateway ? latest.current.snapshot : null;
    let version = previous?.version ?? -1;
    const loadVersion = version;
    setState({ snapshot: previous, loading: true, error: '' });

    function reportError(error: unknown) {
      if (!active) return;
      setState(current => ({ ...current, loading: false, error: error instanceof Error ? error.message : '八维资料暂时无法加载，请重试。' }));
    }

    function accept(value: unknown) {
      if (!active) return;
      try {
        const snapshot = parsePlayerAttributesSnapshot(value);
        if (snapshot === null) {
          if (version >= 0) {
            setState(current => ({ ...current, loading: false }));
            return;
          }
        } else {
          if (snapshot.version < version) return;
          // 同版本重读可完成重试，但不覆盖已接受的实时快照。
          if (snapshot.version === version) {
            setState(current => ({ ...current, loading: false, error: '' }));
            return;
          }
          version = snapshot.version;
        }
        latest.current = { gateway, snapshot };
        setState({ snapshot, loading: false, error: '' });
      } catch (error) {
        reportError(error);
      }
    }

    let unsubscribe: (() => void) | undefined;
    try {
      // 先订阅，再读取，避免加载期间漏掉变更；旧读取结果由版本检查拦截。
      unsubscribe = gateway.subscribe?.(accept);
    } catch (error) {
      reportError(error);
    }
    Promise.resolve().then(() => gateway.load()).then(accept).catch(error => {
      if (version === loadVersion) reportError(error);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [gateway, attempt]);

  return { ...state, retry };
}

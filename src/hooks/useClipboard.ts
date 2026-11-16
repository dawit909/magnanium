"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { copyToClipboard } from "@/lib/clipboard";

export interface UseClipboardOptions {
  timeoutMs?: number;
}

/**
 * Reusable hook for clipboard actions with transient success indicator state.
 */
export function useClipboard({ timeoutMs = 2000 }: UseClipboardOptions = {}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      const ok = await copyToClipboard(text);
      if (ok) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        setCopied(true);
        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, timeoutMs);
      }
      return ok;
    },
    [timeoutMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { copied, copy };
}

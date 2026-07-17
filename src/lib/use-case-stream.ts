"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AgentName,
  CaseEvent,
  DocumentAgentResult,
  DraftAgentResult,
  EscalationResult,
  StrategyAgentResult,
  StreamEvent,
  TrackingUpdate,
} from "@/lib/types";

export interface CaseResults {
  document?: DocumentAgentResult;
  strategy?: StrategyAgentResult;
  draft?: DraftAgentResult;
  tracking?: TrackingUpdate;
  escalation?: EscalationResult;
  ensemble?: number;
  signals?: { ocr: number; classification: number; retrieval: number };
}

export interface CaseStreamState {
  running: boolean;
  events: CaseEvent[];
  results: CaseResults;
  error: string | null;
  done: boolean;
}

const INITIAL: CaseStreamState = { running: false, events: [], results: {}, error: null, done: false };

/** Drives the live agent trace by consuming the SSE stream from /api/case. */
export function useCaseStream() {
  const [state, setState] = useState<CaseStreamState>(INITIAL);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(
    async (imageBase64: string, mediaType: string, language?: string, phone?: string) => {
      abort.current?.abort();
      abort.current = new AbortController();
      setState({ ...INITIAL, running: true });

      try {
        const res = await fetch("/api/case", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, mediaType, language, phone }),
          signal: abort.current.signal,
        });

      if (!res.ok || !res.body) {
        const msg = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        setState((s) => ({ ...s, running: false, error: msg.error ?? "Request failed" }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const evt = JSON.parse(line.slice(5).trim()) as StreamEvent;
          apply(evt, setState);
        }
      }
      setState((s) => ({ ...s, running: false }));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((s) => ({ ...s, running: false, error: (err as Error).message }));
    }
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setState(INITIAL);
  }, []);

  return { state, run, reset };
}

/** Agent name → the key its result is stored under. The Drafting Agent is named
 *  "drafting" but its result lives under `draft`, so this mapping is required —
 *  without it the forms packet is silently dropped. */
const RESULT_KEY: Record<AgentName, keyof CaseResults> = {
  document: "document",
  strategy: "strategy",
  drafting: "draft",
  tracking: "tracking",
  escalation: "escalation",
};

function apply(evt: StreamEvent, setState: React.Dispatch<React.SetStateAction<CaseStreamState>>) {
  setState((s) => {
    const results = { ...s.results };
    switch (evt.type) {
      case "event":
        return { ...s, events: [...s.events, evt.event] };
      case "agent_result": {
        const key = RESULT_KEY[evt.agent];
        if (key) (results as Record<string, unknown>)[key] = evt.result;
        return { ...s, results };
      }
      case "confidence":
        return { ...s, results: { ...results, ensemble: evt.ensemble, signals: evt.signals } };
      case "error":
        return { ...s, error: evt.message };
      case "done":
        return { ...s, done: true, running: false };
      default:
        return s;
    }
  });
}

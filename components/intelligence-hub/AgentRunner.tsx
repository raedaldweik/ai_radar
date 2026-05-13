import React, { useState, useRef, useEffect } from 'react';
import { AgentName, AgentStreamEvent } from '../../types';
import { parseMarkdown } from '../../utils/markdown';
import { exportArtifactToPDF } from '../../utils/pdf-export';

interface AgentRunnerProps {
  agentName: AgentName;
  agentLabel: string;
  endpoint: string;
  payload: any;
  onComplete?: (markdown: string, sources?: { uri: string; title: string }[]) => void;
  onClose?: () => void;
}

interface StepState {
  label: string;
  status: 'active' | 'done';
}

export const AgentRunner: React.FC<AgentRunnerProps> = ({
  agentName,
  agentLabel,
  endpoint,
  payload,
  onComplete,
  onClose,
}) => {
  const [steps, setSteps] = useState<StepState[]>([]);
  const [content, setContent] = useState('');
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent endpoint returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const block of events) {
            const line = block.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            try {
              const event: AgentStreamEvent = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch {
              // ignore malformed event
            }
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to run agent');
        setIsDone(true);
      }
    };

    const handleEvent = (event: AgentStreamEvent) => {
      switch (event.type) {
        case 'step_start':
          setSteps((prev) => [...prev, { label: event.step, status: 'active' }]);
          break;
        case 'step_done':
          setSteps((prev) => prev.map((s) => (s.label === event.step ? { ...s, status: 'done' } : s)));
          break;
        case 'content_delta':
          setContent((prev) => prev + event.text);
          break;
        case 'sources':
          setSources(event.sources);
          break;
        case 'done':
          setIsDone(true);
          onComplete?.(event.markdown, sources);
          break;
        case 'error':
          setError(event.message);
          setIsDone(true);
          break;
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportPDF = async () => {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const docTitle = titleMatch ? titleMatch[1].trim() : agentLabel;
    try {
      await exportArtifactToPDF({
        title: docTitle,
        agentLabel,
        profileName: 'GDRFA AI Radar',
        markdown: content,
        sources,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [content]);

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white text-sm">{agentLabel}</h3>
          {!isDone && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-sky-300 bg-sky-500/10 ring-1 ring-sky-500/30 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Running
            </span>
          )}
          {isDone && !error && (
            <span className="text-[11px] font-medium text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/30 px-2 py-0.5 rounded">
              Complete
            </span>
          )}
          {error && (
            <span className="text-[11px] font-medium text-red-300 bg-red-500/10 ring-1 ring-red-500/30 px-2 py-0.5 rounded">
              Error
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDone && !error && content && (
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 text-[12px] font-medium text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 ring-1 ring-sky-500/30 px-2.5 py-1 rounded transition-colors"
              title="Download as PDF"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export PDF
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="px-5 py-3 border-b border-white/10 space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5 text-[13px]">
              <span className="relative flex-shrink-0 w-3.5 h-3.5">
                {step.status === 'done' ? (
                  <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <>
                    <span className="absolute inset-0 rounded-full bg-sky-500/20" />
                    <span className="absolute inset-0 rounded-full ring-1 ring-sky-400/50 animate-ping" />
                    <span className="absolute inset-[3px] rounded-full bg-sky-400" />
                  </>
                )}
              </span>
              <span className={step.status === 'done' ? 'text-slate-400' : 'text-slate-200'}>
                {step.label}
                {step.status === 'active' && '...'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Live content */}
      {content && (
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <div>{parseMarkdown(content)}</div>
          {!isDone && (
            <span className="inline-block w-1.5 h-4 bg-sky-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
          <div ref={contentEndRef} />
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="px-5 py-3 border-t border-white/10">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sources</h4>
          <ul className="space-y-1">
            {sources.map((source, i) => (
              <li key={i}>
                  <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-sky-400 hover:text-sky-300 hover:underline truncate block"
                  title={source.title}
                >
                  [{i + 1}] {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 py-4 text-sm text-red-300 bg-red-500/5">{error}</div>
      )}
    </div>
  );
};
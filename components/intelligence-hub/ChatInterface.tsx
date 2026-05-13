import React, { useState, useRef, useEffect } from 'react';
import { AgentName } from '../../types';
import { parseMarkdown } from '../../utils/markdown';
import { AgentPillBar, AgentPillDef } from './AgentPillBar';
import { AgentRunner } from './AgentRunner';

export type ThreadMessage =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant_chat'; id: string; text: string; isStreaming: boolean }
  | { kind: 'agent_run'; id: string; agentName: AgentName; agentLabel: string; endpoint: string; payload: any };

interface ChatInterfaceProps {
  // Caller orchestrates payload-building since it knows the KB / scoring context.
  onUserMessage: (params: {
    text: string;
    activeAgent: AgentName | null;
  }) => Promise<void>;
  messages: ThreadMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ThreadMessage[]>>;
  activeAgent: AgentName | null;
  onSelectAgent: (pill: AgentPillDef | null) => void;
  profileLine: React.ReactNode;
  pendingTemplate?: { text: string; selectionStart?: number; selectionEnd?: number } | null;
  onTemplateConsumed?: () => void;
}

// The chat shell: glass panel, message thread, agent pill bar, docked input.
// Two visual states ride on whether the thread is empty:
//   - empty → big centered welcome layout
//   - not empty → docked layout, pills + input pinned to the bottom of the glass card
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onUserMessage,
  messages,
  setMessages,
  activeAgent,
  onSelectAgent,
  profileLine,
  pendingTemplate,
  onTemplateConsumed,
}) => {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const isEmpty = messages.length === 0;

  // When a pill is tapped, IntelligenceHubPage hands us a template to insert.
  useEffect(() => {
    if (!pendingTemplate) return;
    setDraft(pendingTemplate.text);
    onTemplateConsumed?.();

    // Defer focus + selection to after React commits the new draft value.
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      if (
        pendingTemplate.selectionStart !== undefined &&
        pendingTemplate.selectionEnd !== undefined
      ) {
        el.setSelectionRange(pendingTemplate.selectionStart, pendingTemplate.selectionEnd);
      } else {
        // No variable → cursor at end so user can append.
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }, [pendingTemplate, onTemplateConsumed]);

  // Auto-grow the textarea as the user types.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  // Auto-scroll to newest message.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setDraft('');
    try {
      await onUserMessage({ text, activeAgent });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setDraft('');
    onSelectAgent(null);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glass card */}
      <div
        className={`relative backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all duration-300
          ${isEmpty ? 'min-h-[460px]' : 'min-h-[600px] max-h-[78vh]'}`}
        style={{
          boxShadow: '0 30px 80px -30px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Top strip — only shown after conversation starts */}
        {!isEmpty && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="text-[11px] text-slate-400">{profileLine}</div>
            <button
              onClick={handleNewConversation}
              className="text-[11px] text-slate-400 hover:text-sky-300 transition-colors"
            >
              + New conversation
            </button>
          </div>
        )}

        {/* Thread */}
        <div className={`flex-1 overflow-y-auto ${isEmpty ? 'flex items-center justify-center' : 'px-5 py-6'}`}>
          {isEmpty ? (
            <div className="text-center px-6 max-w-xl">
              <h1 className="text-3xl font-semibold text-slate-100 mb-2">
                What can I help you with?
              </h1>
              <p className="text-sm text-slate-400">{profileLine}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg) => (
                <MessageRender key={msg.id} message={msg} />
              ))}
              <div ref={threadEndRef} />
            </div>
          )}
        </div>

        {/* Pill bar + input — same physical relationship in both states */}
        <div className="border-t border-white/5 px-5 py-4">
          <div className={`mb-3 ${isEmpty ? '' : ''}`}>
            <AgentPillBar
              activeAgent={activeAgent}
              onSelectAgent={onSelectAgent}
              size={isEmpty ? 'lg' : 'sm'}
            />
          </div>

          <div className="bg-slate-950/40 border border-white/10 focus-within:border-sky-500/40 focus-within:ring-1 focus-within:ring-sky-500/20 rounded-xl px-3.5 py-2.5 flex items-end gap-2 transition-colors">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeAgent
                  ? 'Edit and send, or just send to run with defaults…'
                  : 'Ask anything, or pick an agent above…'
              }
              rows={1}
              className="flex-1 bg-transparent text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
              style={{ minHeight: '24px', maxHeight: '160px' }}
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || isSending}
              className={`shrink-0 p-1.5 rounded-md transition-all
                ${draft.trim() && !isSending
                  ? 'text-sky-300 hover:text-white hover:bg-sky-500/20'
                  : 'text-slate-600 cursor-not-allowed'
                }`}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {isEmpty && (
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {[
                'What is the EU AI Act\'s August 2026 deadline?',
                'Compare GDRFA to Singapore ICA',
                'Top 3 deepfake detection vendors',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setDraft(ex)}
                  className="text-[11px] text-slate-400 hover:text-sky-300 bg-white/[0.03] hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 rounded-md px-2 py-1 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Message renderers ---

const MessageRender: React.FC<{ message: ThreadMessage }> = ({ message }) => {
  if (message.kind === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-sky-500/15 border border-sky-500/25 text-slate-100 text-sm px-3.5 py-2 rounded-2xl rounded-br-md">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === 'assistant_chat') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[92%]">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
            <div>{parseMarkdown(message.text || '')}</div>
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-sky-400 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (message.kind === 'agent_run') {
    return (
      <div>
        <AgentRunner
          agentName={message.agentName}
          agentLabel={message.agentLabel}
          endpoint={message.endpoint}
          payload={message.payload}
        />
      </div>
    );
  }

  return null;
};
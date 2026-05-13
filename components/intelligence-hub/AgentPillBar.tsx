import React from 'react';
import { AgentName } from '../../types';

export interface AgentPillDef {
  name: AgentName;
  label: string;
  // Returns the template prompt to insert when this pill is tapped.
  // The bracketed variable (if any) is what we auto-select for the user to overwrite.
  template: () => { full: string; selectionStart?: number; selectionEnd?: number };
}

// Templates: the bracketed `[…]` segment is what gets pre-selected so the user
// can immediately start typing to replace it. Indices are computed at insertion time.
function buildTemplate(text: string, varStart: string, varEnd: string): { full: string; selectionStart?: number; selectionEnd?: number } {
  const start = text.indexOf(varStart);
  if (start === -1) return { full: text };
  const end = text.indexOf(varEnd, start + varStart.length);
  if (end === -1) return { full: text };
  return {
    full: text,
    selectionStart: start,
    selectionEnd: end + varEnd.length,
  };
}

export const AGENT_PILLS: AgentPillDef[] = [
  {
    name: 'morning_brief',
    label: 'Morning Brief',
    template: () => ({ full: 'Run my morning brief' }),
  },
  {
    name: 'memo_on_demand',
    label: 'Memo on Demand',
    template: () => buildTemplate(
      'Memo me on [the top-scored signal]',
      '[', ']'
    ),
  },
  {
    name: 'opportunity_scout',
    label: 'Opportunity Scout',
    template: () => ({ full: "Show me this week's pilot-worthy startups" }),
  },
  {
    name: 'peer_benchmark',
    label: 'Peer Benchmark',
    template: () => buildTemplate(
      'Benchmark GDRFA against global peers on [biometric e-gates]',
      '[', ']'
    ),
  },
  {
    name: 'policy_watch',
    label: 'Policy Watch',
    template: () => buildTemplate(
      'Policy watch for [UAE, EU, GCC]',
      '[', ']'
    ),
  },
];

interface AgentPillBarProps {
  activeAgent: AgentName | null;
  onSelectAgent: (agent: AgentPillDef | null) => void;
  size?: 'lg' | 'sm'; // lg for welcome state, sm for docked state
}

export const AgentPillBar: React.FC<AgentPillBarProps> = ({ activeAgent, onSelectAgent, size = 'lg' }) => {
  const handleClick = (pill: AgentPillDef) => {
    // Tap active pill again → deselect (back to free chat).
    if (activeAgent === pill.name) {
      onSelectAgent(null);
    } else {
      onSelectAgent(pill);
    }
  };

  const isLg = size === 'lg';
  const padding = isLg ? 'px-3 py-1.5' : 'px-2.5 py-1';
  const fontSize = isLg ? 'text-xs' : 'text-[11px]';

  return (
    <div className={`flex flex-wrap gap-1.5 ${isLg ? 'justify-center' : 'justify-start'}`}>
      {AGENT_PILLS.map((pill) => {
        const isActive = activeAgent === pill.name;
        return (
          <button
            key={pill.name}
            onClick={() => handleClick(pill)}
            className={`${fontSize} font-medium ${padding} rounded-full transition-all whitespace-nowrap
              ${isActive
                ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40 shadow-[0_0_15px_-5px_rgba(56,189,248,0.5)]'
                : 'bg-white/[0.04] text-slate-300 ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-white/20 hover:text-white'
              }`}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
};
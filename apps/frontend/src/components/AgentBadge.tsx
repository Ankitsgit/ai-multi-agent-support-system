// Shows which AI agent handled the message

import type { AgentType } from '@ai-support/shared';

const AGENT_CONFIG: Record<
  AgentType,
  { label: string; emoji: string; color: string; bg: string }
> = {
  support: { label: 'Support', emoji: '💬', color: '#6366f1', bg: '#eef2ff' },
  order: { label: 'Order', emoji: '📦', color: '#0891b2', bg: '#ecfeff' },
  billing: { label: 'Billing', emoji: '💳', color: '#059669', bg: '#ecfdf5' },
  unknown: { label: 'Assistant', emoji: '🤖', color: '#6b7280', bg: '#f9fafb' },
};

interface AgentBadgeProps {
  agentType: AgentType;
  showLabel?: boolean;
}

export function AgentBadge({ agentType, showLabel = true }: AgentBadgeProps) {
  const config = AGENT_CONFIG[agentType] || AGENT_CONFIG.unknown;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: '600',
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}33`,
        letterSpacing: '0.02em',
      }}
    >
      {config.emoji}
      {showLabel && ` ${config.label} Agent`}
    </span>
  );
}

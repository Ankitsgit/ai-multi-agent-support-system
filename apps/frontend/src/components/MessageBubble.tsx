// Individual message bubble in the chat

import { AgentBadge } from './AgentBadge';
import type { AgentType, Message } from '@ai-support/shared';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  streamingText?: string;
}

export function MessageBubble({ message, isStreaming, streamingText }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const content = isStreaming && streamingText ? streamingText : message.content;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '10px',
        padding: '4px 0',
        animation: 'slideIn 0.2s ease',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isUser
            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          flexShrink: 0,
          alignSelf: 'flex-end',
        }}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxWidth: '70%',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Agent badge (only for assistant messages) */}
        {!isUser && message.agentType && (
          <AgentBadge agentType={message.agentType as AgentType} />
        )}

        {/* Message content */}
        <div
          style={{
            backgroundColor: isUser ? '#6366f1' : '#f3f4f6',
            color: isUser ? '#ffffff' : '#111827',
            borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {content}
          {isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '14px',
                backgroundColor: '#6366f1',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                animation: 'cursorBlink 0.8s infinite',
              }}
            />
          )}
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          {format(new Date(message.createdAt), 'h:mm a')}
        </span>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

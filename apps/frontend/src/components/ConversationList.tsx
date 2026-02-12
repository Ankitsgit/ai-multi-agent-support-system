// Left sidebar: shows list of conversations

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '../api/client';
import { format } from 'date-fns';
import type { Conversation } from '@ai-support/shared';

interface ConversationListProps {
  userId: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: (id: string) => void;
}

export function ConversationList({
  userId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => conversationApi.list(userId),
    refetchInterval: 30000, // Refresh every 30s
  });

  const createMutation = useMutation({
    mutationFn: () => conversationApi.create(userId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      onNewConversation(result.data.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: conversationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
    },
  });

  const conversations: Conversation[] = data?.data || [];

  return (
    <div
      style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
              AI Support
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Multi-Agent System</div>
          </div>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6366f1')}
        >
          ✏️ New Conversation
        </button>
      </div>

      {/* Agent Chips */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px', letterSpacing: '0.08em' }}>
          AVAILABLE AGENTS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {[
            { label: '📦 Orders', color: '#0891b2' },
            { label: '💳 Billing', color: '#059669' },
            { label: '💬 Support', color: '#6366f1' },
          ].map(({ label, color }) => (
            <span
              key={label}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: `${color}15`,
                color,
                border: `1px solid ${color}40`,
                fontWeight: '500',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            No conversations yet.
            <br />Click "New Conversation" to start!
          </div>
        ) : (
          conversations.map((conv) => {
            const lastMessage = conv.messages?.[0];
            const isActive = conv.id === activeConversationId;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                style={{
                  padding: '10px 10px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#eef2ff' : 'transparent',
                  border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
                  transition: 'all 0.1s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.title || 'New conversation'}
                </div>
                {lastMessage && (
                  <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastMessage.content.slice(0, 50)}...
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#d1d5db' }}>
                  {format(new Date(conv.updatedAt), 'MMM d, h:mm a')}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      deleteMutation.mutate(conv.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#9ca3af',
                    opacity: 0,
                    padding: '2px 4px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                  }}
                  title="Delete conversation"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
        User: <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>{userId}</span>
      </div>
    </div>
  );
}

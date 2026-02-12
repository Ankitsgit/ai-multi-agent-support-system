// ==============================================
// CHAT WINDOW - Main chat interface
// Shows messages, handles streaming, typing indicator
// ==============================================

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '../api/client';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { AgentBadge } from './AgentBadge';
import { useStreamingChat } from '../hooks/useStreamingChat';
import type { AgentType, Message } from '@ai-support/shared';

interface ChatWindowProps {
  conversationId: string;
  userId: string;
}

const SUGGESTION_PROMPTS = [
  { text: "Where is my order ORD-001?", agent: "order" as AgentType },
  { text: "What's the status of my refund?", agent: "billing" as AgentType },
  { text: "What is your return policy?", agent: "support" as AgentType },
  { text: "Show me all my orders", agent: "order" as AgentType },
  { text: "I need my invoice for PAY-001", agent: "billing" as AgentType },
  { text: "How long does shipping take?", agent: "support" as AgentType },
];

export function ChatWindow({ conversationId, userId }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const {
    isStreaming,
    streamingText,
    activeTools,
    thinkingPhrase,
    getToolLabel,
    sendStreamingMessage,
    error: streamError,
  } = useStreamingChat();

  // Fetch initial conversation messages
  const { data, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationApi.get(conversationId),
    staleTime: 0,
  });

  // Sync local messages from server
  useEffect(() => {
    if (data?.data?.messages) {
      setLocalMessages(data.data.messages);
    }
  }, [data]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isStreaming, streamingText]);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const messageText = inputValue.trim();
    setInputValue('');

    // Optimistically add user message to UI
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, tempUserMessage]);

    // Create placeholder for streaming assistant message
    const tempAssistantMessage: Message = {
      id: `stream-${Date.now()}`,
      conversationId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setStreamingMessage(tempAssistantMessage);

    await sendStreamingMessage(
      conversationId,
      userId,
      messageText,
      // onComplete callback
      (messageId, agentType, finalText) => {
        // Replace streaming placeholder with real message
        const finalMessage: Message = {
          id: messageId,
          conversationId,
          role: 'assistant',
          content: finalText,
          agentType: agentType as AgentType,
          createdAt: new Date().toISOString(),
        };
        setLocalMessages((prev) => [...prev, finalMessage]);
        setStreamingMessage(null);

        // Refresh conversations list to update preview
        queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const isEmpty = localMessages.length === 0 && !isStreaming;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>
            Customer Support
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            3 AI Agents Ready
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <AgentBadge agentType="order" showLabel={false} />
          <AgentBadge agentType="billing" showLabel={false} />
          <AgentBadge agentType="support" showLabel={false} />
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#9ca3af' }}>
            Loading conversation...
          </div>
        ) : isEmpty ? (
          /* Empty state with suggestions */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
                How can I help you today?
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                I'll route your question to the right specialist automatically.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: '480px', width: '100%' }}>
              {SUGGESTION_PROMPTS.map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: '#374151',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eef2ff';
                    e.currentTarget.style.borderColor = '#c7d2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <span>{suggestion.text}</span>
                  <AgentBadge agentType={suggestion.agent} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <>
            {localMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Streaming message */}
            {isStreaming && streamingMessage && (
              <MessageBubble
                message={streamingMessage}
                isStreaming={true}
                streamingText={streamingText}
              />
            )}

            {/* Typing indicator (shown before text appears) */}
            {isStreaming && !streamingText && (
              <TypingIndicator
                isVisible={true}
                thinkingPhrase={thinkingPhrase}
                activeTools={activeTools}
                getToolLabel={getToolLabel}
              />
            )}

            {/* Error message */}
            {streamError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
                ❌ Error: {streamError}. Please try again.
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            padding: '10px 14px',
            transition: 'border-color 0.15s',
          }}
          onFocus={() => {}}
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              color: '#111827',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          />

          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: inputValue.trim() && !isStreaming ? '#6366f1' : '#e5e7eb',
              color: inputValue.trim() && !isStreaming ? 'white' : '#9ca3af',
              cursor: inputValue.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {isStreaming ? '⏳' : '➤'}
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '6px' }}>
          AI will automatically route your message to the right agent
        </div>
      </div>
    </div>
  );
}

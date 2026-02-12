// ==============================================
// useStreamingChat HOOK
// Handles streaming AI responses with:
// - Typing indicators
// - Tool call display (shows AI reasoning)
// - Error handling
// ==============================================

import { useState, useCallback } from 'react';
import { streamApi } from '../api/client';
import type { AgentType } from '@ai-support/shared';

interface StreamingState {
  isStreaming: boolean;
  streamingText: string;
  activeTools: string[];
  agentType: AgentType | null;
  routingReason: string;
  error: string | null;
}

const THINKING_PHRASES = [
  'Thinking...',
  'Searching database...',
  'Analyzing request...',
  'Looking that up...',
  'Processing...',
  'One moment...',
];

const TOOL_LABELS: Record<string, string> = {
  getOrderDetails: '📦 Fetching order details...',
  checkDeliveryStatus: '🚚 Checking delivery status...',
  listUserOrders: '📋 Loading order history...',
  getInvoiceDetails: '🧾 Retrieving invoice...',
  checkRefundStatus: '💰 Checking refund status...',
  listUserPayments: '💳 Loading payment history...',
  searchFAQ: '🔍 Searching knowledge base...',
  getConversationContext: '💬 Loading conversation context...',
  getSupportCategories: '📚 Getting support categories...',
};

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamingText: '',
    activeTools: [],
    agentType: null,
    routingReason: '',
    error: null,
  });

  const [thinkingPhrase, setThinkingPhrase] = useState(THINKING_PHRASES[0]);

  const sendStreamingMessage = useCallback(
    async (
      conversationId: string,
      userId: string,
      message: string,
      onComplete: (messageId: string, agentType: string, finalText: string) => void
    ) => {
      // Reset state
      setState({
        isStreaming: true,
        streamingText: '',
        activeTools: [],
        agentType: null,
        routingReason: '',
        error: null,
      });

      // Cycle through thinking phrases
      let phraseIndex = 0;
      const phraseInterval = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % THINKING_PHRASES.length;
        setThinkingPhrase(THINKING_PHRASES[phraseIndex]);
      }, 1500);

      let fullText = '';

      try {
        const { agentType, routingReason } = await streamApi.sendMessage(
          conversationId,
          userId,
          message,
          // onChunk - called for each text token
          (text) => {
            fullText += text;
            setState((prev) => ({
              ...prev,
              streamingText: fullText,
            }));
          },
          // onToolCall - called when AI uses a tool
          (tool) => {
            setState((prev) => ({
              ...prev,
              activeTools: [...prev.activeTools, tool],
            }));
          },
          // onDone - called when stream completes
          (messageId, agentType) => {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              agentType: agentType as AgentType,
            }));
            onComplete(messageId, agentType, fullText);
          },
          // onError
          (error) => {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              error,
            }));
          }
        );

        setState((prev) => ({
          ...prev,
          agentType: agentType as AgentType,
          routingReason,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err instanceof Error ? err.message : 'Failed to send message',
        }));
      } finally {
        clearInterval(phraseInterval);
      }
    },
    []
  );

  const getToolLabel = (tool: string) => TOOL_LABELS[tool] || `⚙️ Using ${tool}...`;

  return {
    ...state,
    thinkingPhrase,
    sendStreamingMessage,
    getToolLabel,
  };
}

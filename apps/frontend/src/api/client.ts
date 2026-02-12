// ==============================================
// API CLIENT - Type-safe API calls to backend
// Uses shared types from @ai-support/shared
// ==============================================

import axios from 'axios';
import type {
  SendMessageResponse,
  CreateConversationResponse,
  GetConversationResponse,
  ListConversationsResponse,
  AgentCapability,
  AgentInfo,
  HealthResponse,
} from '@ai-support/shared';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s for AI responses
});

// Request interceptor for logging in development
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    console.error('[API Error]', message);
    throw new Error(message);
  }
);

// ---- CONVERSATION API ----
export const conversationApi = {
  create: async (userId: string): Promise<CreateConversationResponse> => {
    const { data } = await api.post<CreateConversationResponse>('/chat/conversations', { userId });
    return data;
  },

  list: async (userId: string): Promise<ListConversationsResponse> => {
    const { data } = await api.get<ListConversationsResponse>('/chat/conversations', {
      params: { userId },
    });
    return data;
  },

  get: async (conversationId: string): Promise<GetConversationResponse> => {
    const { data } = await api.get<GetConversationResponse>(`/chat/conversations/${conversationId}`);
    return data;
  },

  delete: async (conversationId: string): Promise<void> => {
    await api.delete(`/chat/conversations/${conversationId}`);
  },
};

// ---- MESSAGES API ----
export const messageApi = {
  send: async (
    conversationId: string,
    userId: string,
    message: string
  ): Promise<SendMessageResponse> => {
    const { data } = await api.post<SendMessageResponse>('/chat/messages', {
      conversationId,
      userId,
      message,
    });
    return data;
  },
};

// ---- STREAMING API ----
export const streamApi = {
  /**
   * Sends a message and returns an EventSource-style async iterator
   * Uses fetch() for streaming (axios doesn't support streams well)
   */
  sendMessage: async (
    conversationId: string,
    userId: string,
    message: string,
    onChunk: (text: string) => void,
    onToolCall: (tool: string) => void,
    onDone: (messageId: string, agentType: string) => void,
    onError: (error: string) => void
  ): Promise<{ agentType: string; routingReason: string }> => {
    const response = await fetch('/api/chat/messages/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, userId, message }),
    });

    const agentType = response.headers.get('X-Agent-Type') || 'support';
    const routingReason = response.headers.get('X-Routing-Reason') || '';

    if (!response.ok) {
      onError(`Server error: ${response.status}`);
      return { agentType, routingReason };
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError('Streaming not supported');
      return { agentType, routingReason };
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'text') {
              onChunk(data.content);
            } else if (data.type === 'tool_call') {
              onToolCall(data.tool);
            } else if (data.type === 'done') {
              onDone(data.messageId, data.agentType);
            } else if (data.type === 'error') {
              onError(data.message);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    return { agentType, routingReason };
  },
};

// ---- AGENTS API ----
export const agentsApi = {
  list: async (): Promise<{ success: boolean; data: AgentInfo[] }> => {
    const { data } = await api.get('/agents');
    return data;
  },

  getCapabilities: async (
    type: string
  ): Promise<{ success: boolean; data: AgentCapability }> => {
    const { data } = await api.get(`/agents/${type}/capabilities`);
    return data;
  },
};

// ---- HEALTH API ----
export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    const { data } = await api.get<HealthResponse>('/health');
    return data;
  },
};

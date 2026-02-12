// ==============================================
// CHAT API INTEGRATION TESTS
// Tests HTTP endpoints using Hono's test client
// ==============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  default: {
    conversation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock AI agents
vi.mock('../services/chat.service', () => ({
  chatService: {
    createConversation: vi.fn(),
    listConversations: vi.fn(),
    getConversationWithMessages: vi.fn(),
    deleteConversation: vi.fn(),
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
  },
}));

import { chatService } from '../services/chat.service';

describe('Chat API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/chat/conversations', () => {
    it('should create a new conversation', async () => {
      const mockConversation = {
        id: 'test-uuid-123',
        userId: 'user_demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(chatService.createConversation).mockResolvedValue(mockConversation as any);

      const response = await app.request('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_demo' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('test-uuid-123');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await app.request('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/chat/conversations', () => {
    it('should return conversations for a user', async () => {
      vi.mocked(chatService.listConversations).mockResolvedValue([
        { id: 'conv-1', userId: 'user_demo', messages: [] } as any,
      ]);

      const response = await app.request('/api/chat/conversations?userId=user_demo');
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      const response = await app.request('/api/chat/conversations');
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/chat/conversations/:id', () => {
    it('should return a specific conversation', async () => {
      vi.mocked(chatService.getConversationWithMessages).mockResolvedValue({
        id: 'conv-1',
        userId: 'user_demo',
        messages: [],
      } as any);

      const response = await app.request('/api/chat/conversations/conv-1');
      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent conversation', async () => {
      vi.mocked(chatService.getConversationWithMessages).mockResolvedValue(null);

      const response = await app.request('/api/chat/conversations/nonexistent');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/chat/messages', () => {
    it('should send a message and return response', async () => {
      vi.mocked(chatService.sendMessage).mockResolvedValue({
        userMessage: {
          id: 'msg-1',
          conversationId: 'conv-1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
        } as any,
        agentMessage: {
          id: 'msg-2',
          conversationId: 'conv-1',
          role: 'assistant',
          content: 'Hi! How can I help?',
          agentType: 'support',
          createdAt: new Date(),
        } as any,
        agentType: 'support' as const,
        routingReason: 'General greeting',
      });

      const response = await app.request('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user_demo',
          message: 'Hello',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.agentType).toBe('support');
    });

    it('should validate required fields', async () => {
      const response = await app.request('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }), // Missing conversationId and userId
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await app.request('/api/health');
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('services');
    });
  });

  describe('GET /api/agents', () => {
    it('should list available agents', async () => {
      const response = await app.request('/api/agents');
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(3);
    });
  });
});

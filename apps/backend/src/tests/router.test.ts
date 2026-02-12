// ==============================================
// ROUTER AGENT TESTS
// ==============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentType } from '@ai-support/shared';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('@ai-sdk/google', () => ({ google: vi.fn(() => 'mock-model') }));

import { routeQuery } from '../services/agents/router.agent';
import { generateText } from 'ai';

describe('Router Agent', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('routes order queries to order agent', async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: '{"agentType": "order", "reason": "Contains order number", "confidence": "high"}',
    } as any);
    const result = await routeQuery('Where is my order ORD-001?');
    expect(result.agentType).toBe<AgentType>('order');
    expect(result.confidence).toBe('high');
  });

  it('routes billing queries to billing agent', async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: '{"agentType": "billing", "reason": "Refund request", "confidence": "high"}',
    } as any);
    const result = await routeQuery('I need a refund for my last payment');
    expect(result.agentType).toBe<AgentType>('billing');
  });

  it('routes general questions to support agent', async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: '{"agentType": "support", "reason": "General policy question", "confidence": "high"}',
    } as any);
    const result = await routeQuery('What is your return policy?');
    expect(result.agentType).toBe<AgentType>('support');
  });

  it('falls back to support on AI error', async () => {
    vi.mocked(generateText).mockRejectedValue(new Error('API error'));
    const result = await routeQuery('some random message');
    expect(result.agentType).toBe<AgentType>('support');
    expect(result.confidence).toBe('low');
  });

  it('falls back to support on invalid JSON', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'not valid json' } as any);
    const result = await routeQuery('Some message');
    expect(result.agentType).toBe<AgentType>('support');
  });

  it('includes conversation history in prompt', async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: '{"agentType": "order", "reason": "Continuing order conversation", "confidence": "medium"}',
    } as any);
    const history = [
      { role: 'user', content: 'I placed an order yesterday' },
      { role: 'assistant', content: 'I can help with your order.' },
    ];
    const result = await routeQuery('What is the status?', history);
    expect(result.agentType).toBe<AgentType>('order');
    expect(vi.mocked(generateText)).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('I placed an order yesterday'),
      })
    );
  });
});

// ==============================================
// SUPPORT TOOLS - FAQ search + conversation history
// PostgreSQL: tags is a native String[] array
// ==============================================

import { tool } from 'ai';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';

export const searchFAQ = tool({
  description: 'Search the knowledge base for answers to common customer questions.',
  parameters: z.object({
    query: z.string().describe('The search query or topic to look up'),
    category: z.enum(['shipping', 'returns', 'account', 'product', 'all']).optional(),
  }),
  execute: async ({ query, category }) => {
    try {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(' ').filter((w) => w.length > 2);

      const faqs = await prisma.fAQ.findMany({
        where: {
          ...(category && category !== 'all' ? { category } : {}),
          OR: [
            { question: { contains: queryLower, mode: 'insensitive' } },
            { answer: { contains: queryLower, mode: 'insensitive' } },
            // PostgreSQL native array search
            ...(queryWords.length > 0 ? [{ tags: { hasSome: queryWords } }] : []),
          ],
        },
        take: 3,
      });

      if (faqs.length === 0) {
        return { found: false, message: `No FAQ found for "${query}". Answering from general knowledge.` };
      }

      return {
        found: true,
        results: faqs.map((faq) => ({
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
        })),
      };
    } catch (error) {
      console.error('[searchFAQ]', error);
      return { found: false, message: 'Failed to search knowledge base.' };
    }
  },
});

export const getConversationContext = tool({
  description: 'Retrieve previous messages in this conversation for context.',
  parameters: z.object({
    conversationId: z.string().describe('The current conversation ID'),
    limit: z.number().optional().describe('Number of recent messages to get (default 10)'),
  }),
  execute: async ({ conversationId, limit = 10 }) => {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      if (messages.length === 0) {
        return { found: false, message: 'No previous messages in this conversation.' };
      }

      return {
        found: true,
        messageCount: messages.length,
        messages: messages.reverse().map((m) => ({
          role: m.role,
          content: m.content,
          agentType: m.agentType || 'user',
        })),
      };
    } catch (error) {
      console.error('[getConversationContext]', error);
      return { found: false, message: 'Failed to retrieve conversation history.' };
    }
  },
});

export const getSupportCategories = tool({
  description: 'Get a list of available support topics we can help with.',
  parameters: z.object({}),
  execute: async () => {
    return {
      categories: [
        { name: 'Shipping & Delivery', topics: ['Shipping times', 'International shipping', 'Tracking'] },
        { name: 'Returns & Refunds', topics: ['Return policy', 'How to return', 'Refund timeline'] },
        { name: 'Account Management', topics: ['Password reset', 'Update info', 'Privacy settings'] },
        { name: 'Product Information', topics: ['Warranty', 'Compatibility', 'Specifications'] },
        { name: 'Order Issues', topics: ['Wrong item', 'Damaged package', 'Missing items'] },
      ],
    };
  },
});

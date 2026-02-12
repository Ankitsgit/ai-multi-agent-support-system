// ==============================================
// CHAT SERVICE - Core business logic
// Orchestrates the multi-agent system
// Controller-Service pattern: this is the SERVICE
// ==============================================

import prisma from '../lib/prisma.js';
import { routeQuery } from './agents/router.agent.js';
import { handleOrderQuery, streamOrderQuery } from './agents/order.agent.js';
import { handleBillingQuery, streamBillingQuery } from './agents/billing.agent.js';
import { handleSupportQuery, streamSupportQuery } from './agents/support.agent.js';
import type { AgentType } from '@ai-support/shared';

// Max messages to include in context (token management)
const MAX_CONTEXT_MESSAGES = 12;

export class ChatService {
  // ---- CONVERSATIONS ----

  async createConversation(userId: string) {
    return await prisma.conversation.create({
      data: { userId },
    });
  }

  async listConversations(userId: string) {
    return await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Last message for preview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversationWithMessages(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) return null;

    return conversation;
  }

  async deleteConversation(conversationId: string) {
    // Cascade delete removes messages too (defined in schema)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  // ---- MESSAGES ----

  /**
   * Main entry point: send a message and get AI response
   * Returns both the userMessage and the agentMessage saved in DB
   */
  async sendMessage(conversationId: string, userId: string, userContent: string) {
    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 2. Save user message immediately
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: userContent,
      },
    });

    // 3. Get recent conversation history for context
    const history = await this.getFormattedHistory(conversationId);

    // 4. Route to appropriate agent (uses fast model)
    const routing = await routeQuery(userContent, history);
    const agentType: AgentType = routing.agentType;

    // 5. Get response from the selected agent
    let agentResponse: { text: string; toolsUsed: string[] };

    switch (agentType) {
      case 'order':
        agentResponse = await handleOrderQuery(userContent, history, userId);
        break;
      case 'billing':
        agentResponse = await handleBillingQuery(userContent, history, userId);
        break;
      case 'support':
        agentResponse = await handleSupportQuery(userContent, history, conversationId);
        break;
      default:
        agentResponse = {
          text: "I'm not sure how to help with that. Could you rephrase your question? I can help with orders, billing, or general support questions.",
          toolsUsed: [],
        };
    }

    // 6. Save agent response to database
    const agentMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: agentResponse.text,
        agentType,
        routingReason: routing.reason,
        toolsUsed: agentResponse.toolsUsed,
      },
    });

    // 7. Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        // Auto-generate title from first message if not set
        title: conversation.title || userContent.slice(0, 60),
      },
    });

    return {
      userMessage,
      agentMessage,
      agentType,
      routingReason: routing.reason,
    };
  }

  /**
   * Streaming version: returns a stream for real-time response
   * The controller handles saving after stream completes
   */
  async streamMessage(conversationId: string, userId: string, userContent: string) {
    // 1. Verify conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 2. Save user message
    const userMessage = await prisma.message.create({
      data: { conversationId, role: 'user', content: userContent },
    });

    // 3. Get history
    const history = await this.getFormattedHistory(conversationId);

    // 4. Route
    const routing = await routeQuery(userContent, history);
    const agentType: AgentType = routing.agentType;

    // 5. Get the streaming instance
    let stream;
    switch (agentType) {
      case 'order':
        stream = streamOrderQuery(userContent, history, userId);
        break;
      case 'billing':
        stream = streamBillingQuery(userContent, history, userId);
        break;
      case 'support':
      default:
        stream = streamSupportQuery(userContent, history, conversationId);
        break;
    }

    return {
      stream,
      agentType,
      routingReason: routing.reason,
      userMessage,
      conversationId,
      userId,
      // Callback to save message after stream completes
      saveResponse: async (fullText: string, toolsUsed: string[]) => {
        const agentMessage = await prisma.message.create({
          data: {
            conversationId,
            role: 'assistant',
            content: fullText,
            agentType,
            routingReason: routing.reason,
            toolsUsed,
          },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: new Date(),
            title: conversation.title || userContent.slice(0, 60),
          },
        });
        return agentMessage;
      },
    };
  }

  // ---- PRIVATE HELPERS ----

  /**
   * Get recent messages formatted for AI context
   * Handles token management by limiting to MAX_CONTEXT_MESSAGES
   */
  private async getFormattedHistory(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: MAX_CONTEXT_MESSAGES,
    });

    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }
}

export const chatService = new ChatService();

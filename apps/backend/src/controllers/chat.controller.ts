// ==============================================
// CHAT CONTROLLER - HTTP layer for chat
// Only handles request/response, no business logic
// ==============================================

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { chatService } from '../services/chat.service.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const chat = new Hono();

// Validation schemas
const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  userId: z.string().min(1, 'User ID required'),
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

const createConversationSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
});

// ---- POST /api/chat/conversations ----
// Create a new conversation session
chat.post(
  '/conversations',
  zValidator('json', createConversationSchema),
  async (c) => {
    const { userId } = c.req.valid('json');
    const conversation = await chatService.createConversation(userId);
    return c.json({ success: true, data: conversation }, 201);
  }
);

// ---- GET /api/chat/conversations ----
// List all conversations for a user
chat.get('/conversations', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ success: false, error: 'userId query parameter is required' }, 400);
  }
  const conversations = await chatService.listConversations(userId);
  return c.json({ success: true, data: conversations });
});

// ---- GET /api/chat/conversations/:id ----
// Get a specific conversation with all its messages
chat.get('/conversations/:id', async (c) => {
  const id = c.req.param('id');
  const conversation = await chatService.getConversationWithMessages(id);

  if (!conversation) {
    return c.json({ success: false, error: 'Conversation not found' }, 404);
  }

  return c.json({
    success: true,
    data: {
      conversation,
      messages: conversation.messages,
    },
  });
});

// ---- DELETE /api/chat/conversations/:id ----
// Delete a conversation and all its messages
chat.delete('/conversations/:id', async (c) => {
  const id = c.req.param('id');
  await chatService.deleteConversation(id);
  return c.json({ success: true, message: 'Conversation deleted' });
});

// ---- POST /api/chat/messages ----
// Send a message — main AI interaction endpoint (non-streaming)
chat.post(
  '/messages',
  rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many messages. Please wait a moment.' }),
  zValidator('json', sendMessageSchema),
  async (c) => {
    const { conversationId, userId, message } = c.req.valid('json');

    const result = await chatService.sendMessage(conversationId, userId, message);

    return c.json({
      success: true,
      data: {
        userMessage: result.userMessage,
        agentMessage: result.agentMessage,
        agentType: result.agentType,
        routingReason: result.routingReason,
      },
    });
  }
);

// ---- POST /api/chat/messages/stream ----
// Streaming endpoint — real-time AI response
// Supports SSE (Server-Sent Events) for typing indicator
chat.post(
  '/messages/stream',
  rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many messages. Please wait a moment.' }),
  zValidator('json', sendMessageSchema),
  async (c) => {
    const { conversationId, userId, message } = c.req.valid('json');

    const { stream, agentType, routingReason, saveResponse } =
      await chatService.streamMessage(conversationId, userId, message);

    // Collect full text and tools for saving after stream
    let fullText = '';
    const toolsUsed: string[] = [];

    // Create a TransformStream to intercept and collect the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Stream headers — include agent type so frontend knows who is responding
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('X-Agent-Type', agentType);
    c.header('X-Routing-Reason', routingReason);

    // Process stream in background
    (async () => {
      try {
        for await (const chunk of stream.fullStream) {
          if (chunk.type === 'text-delta') {
            fullText += chunk.textDelta;
            // Send as SSE
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.textDelta })}\n\n`));
          } else if (chunk.type === 'tool-call') {
            toolsUsed.push(chunk.toolName);
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'tool_call', tool: chunk.toolName })}\n\n`
              )
            );
          }
        }

        // Save to database after stream completes
        const agentMessage = await saveResponse(fullText, toolsUsed);

        // Send final event with message ID
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done', messageId: agentMessage.id, agentType })}\n\n`
          )
        );
      } catch (error) {
        console.error('[Stream Error]', error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Agent-Type': agentType,
      },
    });
  }
);

export default chat;

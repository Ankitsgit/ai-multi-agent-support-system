// ==============================================
// ORDER AGENT - Handles order/delivery queries
// Uses Gemini Pro for tool calling
// ==============================================

import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { getOrderDetails, checkDeliveryStatus, listUserOrders } from '../tools/order.tools.js';

const ORDER_SYSTEM_PROMPT = `You are a helpful order support specialist. You help customers with order status, delivery tracking, and order-related questions.

Capabilities:
- Look up specific orders by order number (e.g., ORD-001)
- Track delivery with tracking numbers (e.g., TRK-9876543210)
- View customer order history

Guidelines:
- Be friendly and empathetic
- If you need an order number or tracking number, ask for it politely
- Format order info clearly
- Keep responses concise but complete`;

export async function handleOrderQuery(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId: string
) {
  const result = await generateText({
    model: google('gemini-1.5-flash-latest'),
    system: ORDER_SYSTEM_PROMPT + `\n\nCurrent user ID: ${userId}`,
    messages: [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ],
    tools: { getOrderDetails, checkDeliveryStatus, listUserOrders },
    maxSteps: 5,
  });

  return {
    text: result.text,
    toolsUsed: result.steps
      .flatMap((step) => step.toolCalls || [])
      .map((call) => call.toolName),
  };
}

export function streamOrderQuery(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId: string
) {
  return streamText({
    model: google('gemini-1.5-flash-latest'),
    system: ORDER_SYSTEM_PROMPT + `\n\nCurrent user ID: ${userId}`,
    messages: [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ],
    tools: { getOrderDetails, checkDeliveryStatus, listUserOrders },
    maxSteps: 5,
  });
}

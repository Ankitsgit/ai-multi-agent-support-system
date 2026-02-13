// ==============================================
// BILLING AGENT - Handles payment/refund queries
// Uses Gemini Pro for tool calling
// ==============================================

import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { getInvoiceDetails, checkRefundStatus, listUserPayments } from '../tools/billing.tools.js';

const BILLING_SYSTEM_PROMPT = `You are a helpful billing and payments specialist. You assist customers with payment questions, invoice requests, refund status, and subscription management.

Capabilities:
- Look up invoices and payment receipts
- Check refund status
- Review full billing history

Guidelines:
- Be understanding — billing issues can be stressful
- Never reveal full card numbers
- Completed refunds take 5-10 business days to appear in bank accounts
- Be transparent about what you can and cannot do`;

export async function handleBillingQuery(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId: string
) {
  const result = await generateText({
    model: google('gemini-1.5-flash-latest'),
    system: BILLING_SYSTEM_PROMPT + `\n\nCurrent user ID: ${userId}`,
    messages: [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ],
    tools: { getInvoiceDetails, checkRefundStatus, listUserPayments },
    maxSteps: 5,
  });

  return {
    text: result.text,
    toolsUsed: result.steps
      .flatMap((step) => step.toolCalls || [])
      .map((call) => call.toolName),
  };
}

export function streamBillingQuery(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId: string
) {
  return streamText({
    model: google('gemini-1.5-flash-latest'),
    system: BILLING_SYSTEM_PROMPT + `\n\nCurrent user ID: ${userId}`,
    messages: [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ],
    tools: { getInvoiceDetails, checkRefundStatus, listUserPayments },
    maxSteps: 5,
  });
}

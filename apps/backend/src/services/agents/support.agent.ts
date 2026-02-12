// ==============================================
// SUPPORT AGENT - General support, FAQs
// Uses Gemini Pro for tool calling
// ==============================================

import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { searchFAQ, getConversationContext, getSupportCategories } from '../tools/support.tools.js';

const SUPPORT_SYSTEM_PROMPT = `You are a friendly and knowledgeable customer support specialist. You help customers with general questions, FAQs, account issues, product questions, and troubleshooting.

Capabilities:
- Search the knowledge base for answers
- Access conversation history for context
- Provide support topic information

Guidelines:
- Be warm, friendly, and patient
- Always search the FAQ before answering general questions
- Break down solutions step by step for complex issues
- Never make up policies — use only FAQ information or general knowledge
- End with an offer to help with anything else`;

export async function handleSupportQuery(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  conversationId: string
) {
  const result = await generateText({
    model: google('gemini-1.5-pro'),
    system: SUPPORT_SYSTEM_PROMPT + `\n\nConversation ID: ${conversationId}`,
    messages: [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ],
    tools: { searchFAQ, getConversationContext, getSupportCategories },
    maxSteps: 4,
  });

  return {
    text: result.text,
    toolsUsed: result.steps
      .flatMap((step) => step.toolCalls || [])
      .map((call) => call.toolName),
  };
}

export function streamSupportQuery(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  conversationId: string
) {
  return streamText({
    model: google('gemini-1.5-pro'),
    system: SUPPORT_SYSTEM_PROMPT + `\n\nConversation ID: ${conversationId}`,
    messages: [
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ],
    tools: { searchFAQ, getConversationContext, getSupportCategories },
    maxSteps: 4,
  });
}

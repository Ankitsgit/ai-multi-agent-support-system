// ==============================================
// ROUTER AGENT - Decides which sub-agent handles query
// Uses Gemini Flash (fast + free tier available)
// ==============================================

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { AgentType } from '@ai-support/shared';

interface RoutingDecision {
  agentType: AgentType;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

const ROUTING_SYSTEM_PROMPT = `You are a routing agent for a customer support system. Analyze the customer message and decide which specialist agent should handle it.

Agents:
- "order": Order status, tracking numbers, delivery, order modifications, cancellations
- "billing": Payments, charges, invoices, refunds, receipts, subscriptions
- "support": General FAQs, how-to, account help, product info, troubleshooting, everything else

Rules:
1. Message mentions tracking numbers or order numbers (like ORD-001) → "order"
2. Message mentions payment, refund, invoice, charge, subscription, billing → "billing"
3. Everything else → "support"

Respond ONLY with valid JSON:
{"agentType": "order|billing|support", "reason": "brief reason", "confidence": "high|medium|low"}`;

export async function routeQuery(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<RoutingDecision> {
  try {
    const recentContext = conversationHistory
      .slice(-3)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const contextualMessage = recentContext
      ? `Recent conversation:\n${recentContext}\n\nNew message: ${userMessage}`
      : userMessage;

    const { text } = await generateText({
      model: google('gemini-1.5-flash-latest'),  // Fast + cheap for routing
      system: ROUTING_SYSTEM_PROMPT,
      prompt: contextualMessage,
      maxTokens: 150,
    });

    const cleaned = text.trim().replace(/```json\n?|\n?```/g, '');
    const decision = JSON.parse(cleaned) as RoutingDecision;

    const validAgents: AgentType[] = ['order', 'billing', 'support'];
    if (!validAgents.includes(decision.agentType)) {
      decision.agentType = 'support';
    }

    return decision;
  } catch (error) {
    console.error('[RouterAgent] Error:', error);
    return {
      agentType: 'support',
      reason: 'Fallback: routing error, defaulting to support',
      confidence: 'low',
    };
  }
}

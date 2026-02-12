// ==============================================
// AGENTS CONTROLLER - Agent info endpoints
// ==============================================

import { Hono } from 'hono';
import type { AgentCapability, AgentInfo } from '@ai-support/shared';

const agents = new Hono();

const AGENTS: AgentInfo[] = [
  {
    type: 'support',
    name: 'Support Agent',
    description: 'Handles general inquiries, FAQs, and troubleshooting',
    isActive: true,
  },
  {
    type: 'order',
    name: 'Order Agent',
    description: 'Specializes in order status, tracking, and order management',
    isActive: true,
  },
  {
    type: 'billing',
    name: 'Billing Agent',
    description: 'Handles payments, invoices, refunds, and subscription queries',
    isActive: true,
  },
];

const CAPABILITIES: Record<string, AgentCapability> = {
  support: {
    type: 'support',
    name: 'Support Agent',
    description: 'General customer support specialist with access to knowledge base',
    tools: ['searchFAQ', 'getConversationContext', 'getSupportCategories'],
    examples: [
      'How do I return a product?',
      'What is your shipping policy?',
      'How do I reset my password?',
      'Do you offer international shipping?',
    ],
  },
  order: {
    type: 'order',
    name: 'Order Agent',
    description: 'Order management specialist with live database access',
    tools: ['getOrderDetails', 'checkDeliveryStatus', 'listUserOrders'],
    examples: [
      'Where is my order ORD-001?',
      "What's the status of tracking number TRK-9876543210?",
      'Show me all my orders',
      'Has my order been shipped?',
    ],
  },
  billing: {
    type: 'billing',
    name: 'Billing Agent',
    description: 'Billing and payments specialist with invoice access',
    tools: ['getInvoiceDetails', 'checkRefundStatus', 'listUserPayments'],
    examples: [
      'I need an invoice for my last purchase',
      "What's the status of my refund?",
      'Show me my payment history',
      'I was charged incorrectly',
    ],
  },
};

// GET /api/agents
agents.get('/', (c) => {
  return c.json({ success: true, data: AGENTS });
});

// GET /api/agents/:type/capabilities
agents.get('/:type/capabilities', (c) => {
  const type = c.req.param('type');
  const capability = CAPABILITIES[type];

  if (!capability) {
    return c.json({ success: false, error: `Agent type "${type}" not found` }, 404);
  }

  return c.json({ success: true, data: capability });
});

export default agents;

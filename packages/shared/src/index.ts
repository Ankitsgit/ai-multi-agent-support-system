// ============================================
// SHARED TYPES - Used by both Frontend & Backend
// This is the heart of Hono RPC type safety
// ============================================

// Agent types
export type AgentType = 'support' | 'order' | 'billing' | 'unknown';

// Message types
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  agentType?: AgentType | null;
  createdAt: string;
}

// Conversation types
export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

// API Request / Response types
export interface SendMessageRequest {
  conversationId: string;
  userId: string;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    userMessage: Message;
    agentMessage: Message;
    agentType: AgentType;
    routingReason: string;
  };
}

export interface CreateConversationRequest {
  userId: string;
}

export interface CreateConversationResponse {
  success: boolean;
  data: Conversation;
}

export interface GetConversationResponse {
  success: boolean;
  data: {
    conversation: Conversation;
    messages: Message[];
  };
}

export interface ListConversationsResponse {
  success: boolean;
  data: Conversation[];
}

// Agent capabilities
export interface AgentCapability {
  type: AgentType;
  name: string;
  description: string;
  tools: string[];
  examples: string[];
}

export interface AgentInfo {
  type: AgentType;
  name: string;
  description: string;
  isActive: boolean;
}

// Order types (for tools)
export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// Payment types (for tools)
export interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  invoiceUrl?: string;
  createdAt: string;
  refundStatus?: 'none' | 'requested' | 'processing' | 'completed';
}

// Error response
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

// Health check
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    ai: 'available' | 'unavailable';
  };
}

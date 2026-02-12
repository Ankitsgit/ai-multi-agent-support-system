// ==============================================
// APP - Root component
// Manages conversation selection and layout
// ==============================================

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// In a real app this comes from auth — hardcoded for demo
const DEMO_USER_ID = 'user_demo';

function AppContent() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <ConversationList
        userId={DEMO_USER_ID}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={setActiveConversationId}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeConversationId ? (
          <ChatWindow
            key={activeConversationId}
            conversationId={activeConversationId}
            userId={DEMO_USER_ID}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        backgroundColor: '#fafafa',
        color: '#6b7280',
      }}
    >
      <div style={{ fontSize: '64px' }}>🤖</div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
        AI Customer Support
      </h1>
      <p style={{ margin: 0, fontSize: '15px', textAlign: 'center', maxWidth: '360px' }}>
        Multi-agent system powered by Claude AI.
        <br />
        Start a new conversation to get help with orders, billing, or general support.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        {[
          { emoji: '📦', label: 'Orders', desc: 'Track & manage' },
          { emoji: '💳', label: 'Billing', desc: 'Payments & refunds' },
          { emoji: '💬', label: 'Support', desc: 'FAQs & help' },
        ].map(({ emoji, label, desc }) => (
          <div
            key={label}
            style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              textAlign: 'center',
              width: '110px',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{emoji}</div>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{label}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{desc}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '12px', color: '#d1d5db', margin: 0 }}>
        ← Select or create a conversation to get started
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

// Shows AI thinking status and tool calls in real-time
// This is the "show reasoning" bonus feature

interface TypingIndicatorProps {
  isVisible: boolean;
  thinkingPhrase: string;
  activeTools: string[];
  getToolLabel: (tool: string) => string;
}

export function TypingIndicator({
  isVisible,
  thinkingPhrase,
  activeTools,
  getToolLabel,
}: TypingIndicatorProps) {
  if (!isVisible) return null;

  const latestTool = activeTools[activeTools.length - 1];

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 0',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        🤖
      </div>

      {/* Thinking bubble */}
      <div
        style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '0 16px 16px 16px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          maxWidth: '280px',
        }}
      >
        {/* Tool indicator (shown when using tools) */}
        {latestTool && (
          <div
            style={{
              fontSize: '12px',
              color: '#6366f1',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {getToolLabel(latestTool)}
          </div>
        )}

        {/* Thinking dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#9ca3af',
                  display: 'inline-block',
                  animation: `bounce 1.2s ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{thinkingPhrase}</span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

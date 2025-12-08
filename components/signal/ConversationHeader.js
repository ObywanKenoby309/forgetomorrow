// components/signal/ConversationHeader.js
export default function ConversationHeader({ hasActive, title }) {
  return (
    <header className="mb-2">
      <h2 className="text-sm font-semibold text-gray-800">
        {hasActive ? title || 'Conversation' : 'Your Signal inbox is ready'}
      </h2>
      {!hasActive && (
        <p className="text-xs text-gray-600">
          Start a conversation from a profile, candidate card, or coaching listing.
          Once you send a message, the thread will appear here.
        </p>
      )}
    </header>
  );
}

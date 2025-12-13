// components/signal/ConversationList.js
import MemberAvatarActions from '../member/MemberAvatarActions';

export default function ConversationList({
  threads,
  loading,
  activeConversationId,
  onSelect,
}) {
  return (
    <section className="bg-white rounded-lg shadow p-4 border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">
        Conversations
      </h2>

      {loading ? (
        <p className="text-xs text-gray-500">Loading conversations…</p>
      ) : !threads || threads.length === 0 ? (
        <p className="text-xs text-gray-600">
          No conversations in The Signal yet.
          <br />
          Start a conversation from a member profile or candidate card.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {threads.map((t) => {
            const otherUserId = t.otherUserId || null;
            const otherName = t.title || 'Member';
            const otherAvatar = t.otherAvatarUrl || null;

            return (
              <li
                key={t.id}
                className={`py-2 px-1 flex items-start gap-3 cursor-pointer rounded-md ${
                  t.id === activeConversationId
                    ? 'bg-[#FFF3E9]'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelect && onSelect(t)}
              >
                <div className="flex-shrink-0">
                  {otherUserId ? (
                    <MemberAvatarActions
                      targetUserId={otherUserId}
                      targetName={otherName}
                      showMessage={false} // Only "View profile" + "Connect" here
                    >
                      <button
                        type="button"
                        className="focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {otherAvatar ? (
                          <img
                            src={otherAvatar}
                            alt={otherName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                            {otherName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </button>
                    </MemberAvatarActions>
                  ) : otherAvatar ? (
                    <img
                      src={otherAvatar}
                      alt={otherName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                      {otherName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {t.title}
                    </p>
                    {t.lastMessageAt && (
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        {new Date(t.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {t.lastMessage && (
                    <p className="text-xs text-gray-600 truncate">
                      {t.lastMessage}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

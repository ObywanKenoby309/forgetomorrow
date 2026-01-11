// components/feed/QuickEmojiBar.js
export default function QuickEmojiBar({
  onPick,
  selectedEmojis = [],
  reactionCounts = {},
  onMouseEnter,
  onMouseLeave,
  emojis, // ✅ NEW: allow caller to control which emojis render
}) {
  const defaultEmojis = ['👍', '🔥', '🎉', '👏', '❤️'];
  const list = Array.isArray(emojis) && emojis.length ? emojis : defaultEmojis;

  const handleClick = (emoji) => {
    if (typeof onPick === 'function') {
      onPick(emoji);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {list.map((emoji) => {
        const count = reactionCounts[emoji] || 0;
        const isSelected = selectedEmojis.includes(emoji);

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleClick(emoji)}
            onMouseEnter={() => onMouseEnter?.(emoji)}
            onMouseLeave={onMouseLeave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-base font-medium transition-all duration-200 border ${
              isSelected
                ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
                : 'bg-gray-100 border-transparent hover:bg-gray-200 text-gray-700 hover:shadow'
            }`}
            aria-label={isSelected ? `Remove ${emoji}` : `Add ${emoji}`}
            title={isSelected ? `Remove ${emoji}` : `Add ${emoji}`}
          >
            <span className="text-xl">{emoji}</span>
            {count > 0 && (
              <span className="text-xs text-gray-600 font-semibold">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

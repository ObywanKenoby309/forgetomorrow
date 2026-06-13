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
    <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
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
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-base font-medium transition-all duration-150 border ${
              isSelected
                ? 'bg-orange-500/15 border-orange-400/40 text-[#b6481f] shadow-sm'
                : 'bg-white/40 border-white/40 text-[#6b4a3a] hover:bg-white/60 hover:border-white/60 hover:-translate-y-0.5'
            }`}
            aria-label={isSelected ? `Remove ${emoji}` : `Add ${emoji}`}
            title={isSelected ? `Remove ${emoji}` : `Add ${emoji}`}
          >
            <span className="text-lg sm:text-xl">{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-semibold text-[#a8775f]">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
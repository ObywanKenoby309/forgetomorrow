// components/signal/MessageComposer.js
export default function MessageComposer({
  disabled,
  value,
  onChange,
  onSend,
  sending,
  placeholder,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSend || disabled || !value.trim() || sending) return;
    onSend();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] disabled:bg-gray-50"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || !value.trim() || sending}
          className="px-4 py-2 rounded-md bg-[#ff8a65] text-white text-sm font-semibold disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  );
}

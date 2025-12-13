// components/member/MemberAvatarActions.js
import { useEffect, useRef, useState } from 'react';
import MemberActions from './MemberActions';

export default function MemberAvatarActions({
  children,
  targetUserId,
  targetName = 'Member',
  showMessage = true, // 👈 NEW
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const toggle = () => {
    if (!targetUserId) return;
    setOpen((prev) => !prev);
  };

  const close = () => setOpen(false);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClick = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  if (!targetUserId) {
    // Just render children without menu if we don't know the user
    return children;
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={toggle}>{children}</div>

      {open && (
        <div className="absolute z-30 mt-1 w-56 rounded-lg border bg-white shadow-lg text-sm">
          <div className="px-3 py-2 border-b font-semibold truncate">
            {targetName}
          </div>
          <MemberActions
            targetUserId={targetUserId}
            targetName={targetName}
            layout="menu"
            onClose={close}
            showMessage={showMessage} // 👈 pass through
          />
        </div>
      )}
    </div>
  );
}

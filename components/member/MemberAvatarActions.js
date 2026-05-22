// components/member/MemberAvatarActions.js
import { useEffect, useRef, useState } from 'react';
import MemberActions from './MemberActions';

export default function MemberAvatarActions({
  children,
  targetUserId,
  targetUserSlug,
  targetName = 'Member',
  surface = 'default',
  showProfile = true,
  showMessage,
  showConnect = true,
  profilePath,
  stopPropagation = true,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const normalizedSurface = String(surface || 'default').toLowerCase();
  const resolvedShowMessage =
    typeof showMessage === 'boolean' ? showMessage : normalizedSurface !== 'signal';

  const toggle = (event) => {
    if (stopPropagation) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
    }
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
      <div onClick={toggle} className="cursor-pointer">{children}</div>

      {open && (
        <div className="absolute z-30 mt-1 w-56 rounded-lg border bg-white shadow-lg text-sm">
          <div className="px-3 py-2 border-b font-semibold truncate">
            {targetName}
          </div>
          <MemberActions
            targetUserId={targetUserId}
            targetUserSlug={targetUserSlug}
            targetName={targetName}
            layout="menu"
            surface={normalizedSurface}
            onClose={close}
            showProfile={showProfile}
            showMessage={resolvedShowMessage}
            showConnect={showConnect}
            profilePath={profilePath}
          />
        </div>
      )}
    </div>
  );
}
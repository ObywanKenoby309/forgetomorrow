// components/SupportFloatingButton.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function SupportFloatingButton() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // While auth status is loading, don't flash the button
  if (status === 'loading') {
    return null;
  }

  // Hide entirely for non-authenticated users (keeps HelpDesk off public pages)
  if (!session?.user) {
    return null;
  }

  // Optional: hide on auth pages or support page itself
  const hideOnRoutes = new Set(['/auth/signin', '/auth/signup', '/support']);
  if (hideOnRoutes.has(router.pathname)) {
    return null;
  }

  // Preserve chrome mode (seeker / coach / recruiter-smb / recruiter-ent)
  const chrome = String(router.query.chrome || '').toLowerCase();
  const supportHref = chrome ? `/support?chrome=${chrome}` : '/support';

  const handleClick = (e) => {
    // Hook for any future page-specific logic on click
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href={supportHref} legacyBehavior>
        <a
          onClick={handleClick}
          className="
            flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
            bg-[#FF7043] text-white text-sm font-medium
            hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7043]
          "
        >
          <span className="inline-block w-2 h-2 rounded-full bg-lime-300" />
          <span>Need help? Chat with Support</span>
        </a>
      </Link>
    </div>
  );
}

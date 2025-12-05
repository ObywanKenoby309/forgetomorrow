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

  // Only show on *app* surfaces, never on public marketing pages.
  // Add new app sections here as needed.
  const pathname = router.pathname || '';
  const allowedPrefixes = [
    '/seeker',
    '/recruiter',
    '/coaching',
    '/jobs',
    '/resume',
    '/cover',
    '/roadmap',
    '/feed',
    '/profile',
    '/seeker-dashboard',
    '/recruiter-dashboard',
    '/coaching-dashboard',
    '/support', // still treated as app, but hidden above by hideOnRoutes
  ];

  const isAllowed = allowedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isAllowed) {
    // e.g. '/', '/pricing', '/about', etc. → no floating button
    return null;
  }

  // Preserve chrome mode (seeker / coach / recruiter-smb / recruiter-ent)
  const queryChrome = String(router.query.chrome || '').toLowerCase();
  let chrome = queryChrome;

  // If chrome not explicitly set in URL, derive from user role
  if (!chrome) {
    const role = String(session.user.role || '').toLowerCase();

    if (role.startsWith('recruiter')) {
      // recruiter_smb, recruiter_ent, recruiter_admin, etc.
      chrome = role.includes('ent') ? 'recruiter-ent' : 'recruiter-smb';
    } else if (role.includes('coach')) {
      chrome = 'coach';
    } else {
      // default to seeker experience
      chrome = 'seeker';
    }
  }

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

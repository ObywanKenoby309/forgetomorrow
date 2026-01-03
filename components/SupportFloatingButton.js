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

  // Hide entirely for non-authenticated users
  if (!session?.user) {
    return null;
  }

  // Hide ONLY on the support page itself
  if (router.pathname === '/support') {
    return null;
  }

  // Preserve chrome mode (seeker / coach / recruiter-smb / recruiter-ent)
  const queryChrome = String(router.query.chrome || '').toLowerCase();
  let chrome = queryChrome;

  // If chrome not explicitly set in URL, derive from user role
  if (!chrome) {
    const role = String(session.user.role || '').toLowerCase();

    if (role.startsWith('recruiter')) {
      chrome = role.includes('ent') ? 'recruiter-ent' : 'recruiter-smb';
    } else if (role.includes('coach')) {
      chrome = 'coach';
    } else {
      chrome = 'seeker';
    }
  }

  const supportHref = chrome ? `/support?chrome=${chrome}` : '/support';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href={supportHref} legacyBehavior>
        <a
          className="
            flex items-center justify-center gap-2
            px-4 py-3 md:px-4 md:py-3
            rounded-full shadow-lg
            bg-[#FF7043] text-white text-sm font-medium
            hover:brightness-110 focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-[#FF7043]
          "
        >
          {/* Status dot – desktop only */}
          <span className="hidden md:inline-block w-2 h-2 rounded-full bg-lime-300" />

          {/* Chat icon – mobile only */}
          <svg
            className="w-6 h-6 md:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h8m-8 4h5m9-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          {/* Text – desktop only */}
          <span className="hidden md:inline">
            Need help? Chat with Support
          </span>
        </a>
      </Link>
    </div>
  );
}

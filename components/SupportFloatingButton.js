// components/SupportFloatingButton.js

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function SupportFloatingButton() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // While auth status is loading, don't flash the button
  if (status === 'loading') return null;

  // Hide for non-authenticated users
  if (!session?.user) return null;

  // Hide on the support page itself
  if (router.pathname === '/support') return null;

  // Preserve chrome mode
  const queryChrome = String(router.query.chrome || '').toLowerCase();
  let chrome = queryChrome;

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
    <div className="fixed bottom-4 right-6 z-50">
      <Link href={supportHref} aria-label="Open Support Center">
        <a
          className="
            relative
            flex items-center justify-center
            w-[46px] h-[46px]
            rounded-full
            bg-[#FF7043]
            text-white
            shadow-lg
            hover:brightness-110
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-[#FF7043]
          "
        >
          {/* Chat bubble icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          </svg>

          {/* Online indicator */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-lime-300 border border-white" />
        </a>
      </Link>
    </div>
  );
}

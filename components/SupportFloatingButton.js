// components/SupportFloatingButton.js
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SupportFloatingButton() {
  const router = useRouter();

  // Optional: hide on auth pages or support page itself
  const hideOnRoutes = new Set(['/auth/signin', '/auth/signup', '/support']);
  if (hideOnRoutes.has(router.pathname)) {
    return null;
  }

  const handleClick = (e) => {
    // If the current page has any special logic later, we can hook it here
    // For now we just let Next.js handle navigation
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/support" legacyBehavior>
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

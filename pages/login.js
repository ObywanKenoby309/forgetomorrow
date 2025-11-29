import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/signin');
  }, [router]);

  // Accessibility: provide a polite live region during redirect
  return (
    <main
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
      }}
    >
      Redirecting to sign-in…
    </main>
  );
}

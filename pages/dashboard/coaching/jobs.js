// pages/dashboard/coaching/pipeline.js
// Thin redirect so coaches land on the Seeker Pipeline with coach chrome.
// Keeps existing links/bookmarks working.

export async function getServerSideProps(context) {
  const { query } = context;

  // Preserve any existing query params and force chrome=coach
  const params = new URLSearchParams({ ...query, chrome: 'coach' });
  const destination = `/seeker/applications?${params.toString()}`;

  return {
    redirect: {
      destination,
      permanent: false, // flip to true when you're confident
    },
  };
}

// The page never renders — SSR redirect happens first.
export default function CoachingPipelineRedirect() {
  return null;
}

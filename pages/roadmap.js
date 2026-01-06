// pages/roadmap.js
// NOTE: Full rename migration.
// This route now permanently redirects to /anvil to avoid user confusion and preserve old links.

export async function getServerSideProps(ctx) {
  const q = ctx?.query || {};
  const rawChrome = Array.isArray(q.chrome) ? q.chrome[0] : q.chrome;
  const chrome = String(rawChrome || "").toLowerCase().trim();

  const destination = chrome
    ? `/anvil?chrome=${encodeURIComponent(chrome)}`
    : "/anvil";

  return {
    redirect: {
      destination,
      permanent: true, // 301
    },
  };
}

export default function RoadmapRedirect() {
  return null;
}

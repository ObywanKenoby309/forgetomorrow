// pages/seeker/profile-views.js — redirect shim
// This page has been absorbed into /seeker/contact-center?tab=profileViews
// Keep this file so existing bookmarks and links continue to work.
export default function Redirect() { return null; }

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/seeker/contact-center?tab=profileViews',
      permanent: false,
    },
  };
}
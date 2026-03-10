// pages/profile.js
export async function getServerSideProps(context) {
  const { chrome, verified } = context.query || {};

  const params = new URLSearchParams();

  if (typeof chrome === 'string' && chrome) {
    params.set('chrome', chrome);
  }

  if (typeof verified === 'string' && verified) {
    params.set('verified', verified);
  }

  const query = params.toString();
  const destination = query ? `/profile/edit?${query}` : '/profile/edit';

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
}

export default function ProfileRedirect() {
  return null;
}
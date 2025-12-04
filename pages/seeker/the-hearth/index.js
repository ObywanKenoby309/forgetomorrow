// pages/seeker/the-hearth/index.js
export default function RedirectHearth() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/the-hearth',
      permanent: false,
    },
  };
}

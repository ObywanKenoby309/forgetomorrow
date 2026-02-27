export default function LoginRedirect() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/auth/signin',
      permanent: true,
    },
  };
}
// pages/messages.js
export async function getServerSideProps(context) {
  const { query } = context;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query || {})) {
    if (Array.isArray(value)) {
      if (value[0] != null) params.set(key, value[0]);
    } else if (value != null) {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  const destination = `/seeker/messages${qs ? `?${qs}` : ''}`;

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
}

export default function MessagesRedirect() {
  return null;
}

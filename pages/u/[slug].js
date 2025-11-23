// pages/u/[slug].js
import Head from 'next/head';
import { prisma } from '@/lib/prisma';

export async function getServerSideProps(context) {
  const { slug } = context.params;

  // Look up user by slug (public profile fields only)
  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      firstName: true,
      lastName: true,
      headline: true,     // Add later if stored
      pronouns: true,     // Add later if stored
      location: true,     // Add later if stored
      status: true,       // Add later if stored
      avatarUrl: true,    // Add later if stored
      coverUrl: true,     // Add later if stored
    },
  });

  if (!user) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
    },
  };
}

export default function PublicProfile({ user }) {
  const {
    name,
    headline,
    pronouns,
    location,
    status,
    avatarUrl,
    coverUrl,
    slug,
  } = user;

  const fullName = name || 'Unknown User';
  const profileUrl = `https://forgetomorrow.com/u/${slug}`;

  return (
    <>
      <Head>
        <title>{fullName} – ForgeTomorrow Profile</title>
        <meta
          name="description"
          content={`View the professional profile of ${fullName} on ForgeTomorrow.`}
        />
      </Head>

      <main
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '20px',
          minHeight: '80vh',
        }}
      >
        {/* Cover banner */}
        {coverUrl && (
          <div
            style={{
              width: '100%',
              height: 260,
              backgroundImage: `url(${coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 12,
              marginBottom: 20,
            }}
          />
        )}

        {/* Card */}
        <section
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            padding: 20,
            background: 'white',
            display: 'flex',
            gap: 20,
          }}
        >
          {/* Avatar */}
          <img
            src={avatarUrl || '/demo-profile.jpg'}
            alt="Profile photo"
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid #FF7043',
            }}
          />

          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                color: '#263238',
              }}
            >
              {fullName}
            </h1>

            {pronouns && (
              <p style={{ margin: '4px 0', color: '#607D8B' }}>{pronouns}</p>
            )}

            {headline && (
              <p
                style={{
                  margin: '6px 0',
                  fontSize: 16,
                  color: '#455A64',
                }}
              >
                {headline}
              </p>
            )}

            {(location || status) && (
              <p
                style={{
                  margin: '6px 0',
                  fontSize: 14,
                  color: '#455A64',
                }}
              >
                {location && `Location: ${location}`} {status && `• ${status}`}
              </p>
            )}

            {/* Public URL display */}
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: '#455A64',
                  background: '#ECEFF1',
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                {profileUrl}
              </span>

              {/* Copy button */}
              <button
                onClick={() => navigator.clipboard.writeText(profileUrl)}
                style={{
                  background: '#FF7043',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </section>

        {/* Ribbon */}
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: '#90A4AE',
            textAlign: 'center',
          }}
        >
          This is a public ForgeTomorrow profile.
        </div>
      </main>
    </>
  );
}

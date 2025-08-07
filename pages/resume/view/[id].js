// pages/resume/view/[id].js
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ViewResume() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>View Resume | ForgeTomorrow</title>
      </Head>

      <main className="max-w-4xl mx-auto px-6 pt-[100px] pb-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <section className="bg-white rounded-lg shadow p-8 space-y-6">
          <h1 className="text-3xl font-bold text-[#FF7043]">Viewing Resume</h1>
          <p className="text-lg text-gray-700">Resume ID: <strong>{id}</strong></p>

          <div className="bg-[#F5F5F5] p-6 border border-dashed border-gray-400 rounded text-center text-gray-500">
            🚧 This is a placeholder. Resume content for <code>{id}</code> will be shown here.
          </div>
        </section>
      </main>
    </>
  );
}

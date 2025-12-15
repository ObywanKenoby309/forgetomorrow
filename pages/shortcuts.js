import Head from "next/head";

export default function Shortcuts() {
  return (
    <>
      <Head>
        <title>Keyboard Shortcuts - ForgeTomorrow</title>
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-10 text-slate-100">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-4">
          Keyboard Shortcuts
        </h1>

        <p className="text-slate-300 mb-6 text-sm">
          Keyboard shortcuts are not active in ForgeTomorrow yet. We are
          planning to add a small set of global shortcuts, and this page shows
          the shortcuts we expect to support so you know what is coming.
        </p>

        <section
          className="bg-black/40 rounded-lg p-4 border border-white/10"
          aria-label="Planned keyboard shortcuts"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-3">
            Planned shortcuts
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="py-2 pr-6">Action</th>
                <th className="py-2">Shortcut</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              <tr>
                <td className="py-2 pr-6">Open global search</td>
                <td className="py-2">
                  <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-6">Create new item</td>
                <td className="py-2">
                  <kbd>N</kbd>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-6">Open help and support</td>
                <td className="py-2">
                  <kbd>?</kbd>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}

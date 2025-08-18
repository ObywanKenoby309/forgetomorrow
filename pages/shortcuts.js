import Head from "next/head";

export default function Shortcuts() {
  return (
    <>
      <Head>
        <title>Keyboard Shortcuts — ForgeTomorrow</title>
      </Head>
      <main className="max-w-4xl mx-auto px-6 py-10 text-slate-100">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-4">Keyboard Shortcuts</h1>

        <div className="bg-black/40 rounded-lg p-4 border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="py-2 pr-6">Action</th>
                <th className="py-2">Shortcut</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              <tr>
                <td className="py-2 pr-6">Open search</td>
                <td className="py-2"><kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd></td>
              </tr>
              <tr>
                <td className="py-2 pr-6">Create new</td>
                <td className="py-2"><kbd>N</kbd></td>
              </tr>
              <tr>
                <td className="py-2 pr-6">Open help</td>
                <td className="py-2"><kbd>?</kbd></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

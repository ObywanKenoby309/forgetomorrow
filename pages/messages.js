import Head from 'next/head';

export default function Messages() {
  const alertComingSoon = (feature) => () => alert(`${feature} feature coming soon!`);

  return (
    <>
      <Head>
        <title>ForgeTomorrow - The Signal</title>
      </Head>

      <main className="max-w-4xl mx-auto p-6 space-y-8 min-h-[80vh] bg-[#ECEFF1] text-[#212121] pt-20">
        <h1 className="text-4xl font-bold text-[#FF7043] mb-6 text-center">The Signal</h1>

        <section className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-6 min-h-[60vh]">
          {/* Threads list */}
          <div className="threads w-full md:w-72 bg-[#1a1a1a] border border-gray-700 rounded-md overflow-y-auto">
            {[
              { name: 'Jane Doe', preview: 'Hey Eric, excited about ForgeTomorrow!', time: '2h ago' },
              { name: 'John Smith', preview: "Let's schedule a call.", time: '1d ago' },
              { name: 'Samantha Lee', preview: 'Thanks for the update.', time: '3d ago' },
            ].map(({ name, preview, time }) => (
              <div
                key={name}
                className={`thread p-4 border-b border-gray-700 cursor-pointer hover:bg-[#ff7043] hover:text-white ${
                  name === 'Jane Doe' ? 'bg-[#ff4500] text-white font-semibold' : ''
                }`}
                tabIndex={0}
                role="button"
                aria-label={`Chat with ${name}`}
                onClick={alertComingSoon(`Chat with ${name}`)}
                onKeyPress={(e) => { if (e.key === 'Enter') alertComingSoon(`Chat with ${name}`)(); }}
              >
                <div className="name font-bold text-lg">{name}</div>
                <div className="preview text-sm text-gray-300 truncate">{preview}</div>
                <div className="time text-xs text-gray-400 text-right">{time}</div>
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div className="chat flex-grow flex flex-col bg-[#222] rounded-md p-6 text-[#eee]">
            <div className="messages flex-grow overflow-y-auto space-y-4 mb-4">
              <div className="message received max-w-[70%] bg-[#333] rounded-2xl rounded-bl-none p-4">
                Hey Eric! Excited about ForgeTomorrow?
                <div className="time text-xs text-gray-400 mt-1 text-right">10:15 AM</div>
              </div>
              <div className="message sent max-w-[70%] bg-[#ff4500] rounded-2xl rounded-br-none p-4 self-end">
                Absolutely! Can’t wait to get started.
                <div className="time text-xs text-gray-400 mt-1 text-right">10:17 AM</div>
              </div>
            </div>

            <div className="input-area flex gap-2">
              <textarea
                id="message-input"
                placeholder="Type your message..."
                className="flex-grow resize-none rounded-md p-3 bg-[#333] text-white focus:outline-none"
                rows={3}
                disabled
                aria-label="Message input (coming soon)"
              />
              <button
                className="bg-[#ff4500] px-6 rounded-md font-bold text-white cursor-not-allowed"
                disabled
                aria-label="Send message button (coming soon)"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

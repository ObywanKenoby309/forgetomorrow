// pages/index.js
import Head from 'next/head';

export default function Home() {
  const sendWaitlistEmail = async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('user_email');
    if (!emailInput.value) {
      alert('Please enter a valid email.');
      return;
    }

    try {
      const emailjs = await import('emailjs-com');
      emailjs.init('YyYidv88o9X7iKfYJ');
      await emailjs.send('service_quxmizv', 'forgetomorrow', {
        user_email: emailInput.value,
      });
      alert('Success! You’re on the waitlist.');
      emailInput.value = '';
    } catch (error) {
      alert('Something went wrong. Try again.');
    }
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow | Home</title>
      </Head>

      <main className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-2xl">
          A place for the overlooked. The underestimated. The fighters.
        </h1>

        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl">
          ForgeTomorrow is building a better career platform — no gatekeeping. No noise. Just
          support, truth, and traction.
        </p>

        <form onSubmit={sendWaitlistEmail} className="w-full max-w-md">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              id="user_email"
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-md bg-white text-black"
            />
            <button
              type="submit"
              className="bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold py-3 px-6 rounded-md w-full sm:w-auto"
            >
              Join the Waitlist
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

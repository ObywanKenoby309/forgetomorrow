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
      emailjs.init('YyYidv88o9X7iKfYJ'); // Replace with your actual public key
      await emailjs.send('service_quxmizv', 'forgetomorrow', {
        user_email: emailInput.value,
      });
      alert('Success! You’ve been added to the waitlist.');
      emailInput.value = '';
    } catch (error) {
      alert('Something went wrong. Please try again later.');
    }
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow | Home</title>
      </Head>

      <main
        role="main"
        aria-label="Welcome to ForgeTomorrow"
        className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 py-24 text-white"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          A place for the overlooked. The underestimated. The fighters.
        </h1>

        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl">
          ForgeTomorrow is building a better career platform — no gatekeeping, no noise. Just real
          opportunities and support for job seekers and dreamers.
        </p>

        <form onSubmit={sendWaitlistEmail} className="w-full max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <input
              id="user_email"
              type="email"
              placeholder="Enter your email"
              className="w-full sm:flex-1 px-4 py-3 rounded-l sm:rounded-none sm:rounded-l-md bg-white text-black"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto mt-4 sm:mt-0 sm:ml-2 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold py-3 px-6 rounded sm:rounded-r-md"
            >
              Join the Waitlist
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

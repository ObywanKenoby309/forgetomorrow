import Head from 'next/head';

export default function Signup() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Sign Up functionality coming soon!');
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Sign Up</title>
      </Head>

      <main className="flex items-center justify-center min-h-screen bg-[#ECEFF1] text-[#212121] px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mt-20">
          <h1 className="text-3xl font-bold text-[#FF7043] mb-6 text-center">Create Your Account</h1>

          <form id="signupForm" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Your full name"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Create a password"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                placeholder="Confirm your password"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF7043] text-white py-3 rounded font-semibold hover:bg-[#F4511E] transition-colors"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-[#FF7043] font-semibold hover:underline">
              Login
            </a>
          </p>
        </div>
      </main>
    </>
  );
}

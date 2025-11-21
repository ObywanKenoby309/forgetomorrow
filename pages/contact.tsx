// pages/contact.tsx
import Head from 'next/head';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Head>
        <title>Contact | Forge Tomorrow</title>
        <meta name="description" content="Contact Forge Tomorrow for inquiries, support, or general questions." />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-4">
            Contact Forge Tomorrow
          </h1>
          <p className="text-gray-600 mb-12">
            Have questions, suggestions, or need support? Fill out the form below, or use our contact details to reach us directly.
          </p>

          {/* Corporate Info */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Corporate Information</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>Mailing Address:</strong></p>
              <p>Forge Tomorrow Inc.</p>
              <p>P.O. Box 1034</p>
              <p>White House, TN 37188</p>
              <p><strong>Business Hours:</strong> Mon–Fri, 9:00AM–5:00PM</p>
              <p><strong>Email:</strong> <a href="mailto:contact@forgetomorrow.com" className="text-orange-600 underline">contact@forgetomorrow.com</a></p>
              <p><strong>Phone:</strong> TBD</p>
            </div>
          </section>

          {/* Contact Form / Thank You */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Send Us a Message</h2>

            <AnimatePresence>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-100 border border-green-300 text-green-800 p-6 rounded-xl text-center"
                >
                  <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
                  <p>Your message has been received. We’ll get back to you soon.</p>
                </motion.div>
              ) : (
                <form
                  action="https://formspree.io/f/YOUR_FORM_ID_HERE"
                  method="POST"
                  className="space-y-6"
                  onSubmit={() => setSubmitted(true)}
                >
                  <div>
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-6 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-6 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-6 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="w-full px-6 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-orange-200"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl transition"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </AnimatePresence>
          </section>

          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <a href="/" className="text-orange-600 hover:underline">← Back to Forge Tomorrow</a>
          </div>
        </div>
      </div>
    </>
  );
}

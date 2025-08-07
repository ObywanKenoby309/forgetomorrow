// components/resume-form/ContactInfoSection.js

export default function ContactInfoSection({ contactInfo, onChange }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-[#FF7043]">Contact Information</h2>

      <div>
        <label className="block font-semibold mb-1">Full Name</label>
        <input
          type="text"
          className="w-full border rounded px-4 py-2"
          value={contactInfo.fullName}
          onChange={(e) => onChange({ ...contactInfo, fullName: e.target.value })}
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Professional Title</label>
        <input
          type="text"
          className="w-full border rounded px-4 py-2"
          value={contactInfo.title}
          onChange={(e) => onChange({ ...contactInfo, title: e.target.value })}
          placeholder="Product Manager"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Email</label>
        <input
          type="email"
          className="w-full border rounded px-4 py-2"
          value={contactInfo.email}
          onChange={(e) => onChange({ ...contactInfo, email: e.target.value })}
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Phone</label>
        <input
          type="text"
          className="w-full border rounded px-4 py-2"
          value={contactInfo.phone}
          onChange={(e) => onChange({ ...contactInfo, phone: e.target.value })}
          placeholder="(123) 456-7890"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">LinkedIn</label>
        <input
          type="url"
          className="w-full border rounded px-4 py-2"
          value={contactInfo.linkedin}
          onChange={(e) => onChange({ ...contactInfo, linkedin: e.target.value })}
          placeholder="https://linkedin.com/in/yourname"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Portfolio / Website</label>
        <input
          type="url"
          className="w-full border rounded px-4 py-2"
          value={contactInfo.website}
          onChange={(e) => onChange({ ...contactInfo, website: e.target.value })}
          placeholder="https://yourportfolio.com"
        />
      </div>
    </section>
  );
}

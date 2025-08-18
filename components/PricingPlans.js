// components/PricingPlans.js
function Card({ title, price, period, features, marketValue, savings, highlight, buttonText }) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 flex flex-col ${
        highlight ? "border-4 border-[#FF7043]" : ""
      }`}
    >
      <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">{title}</h2>

      {price ? (
        <div className="mb-3">
          <p className="text-4xl font-bold">
            {price} <span className="text-base font-normal">/ {period}</span>
          </p>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-xl font-semibold text-gray-600">Custom Pricing</p>
        </div>
      )}

      {savings && (
        <div className="mb-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800">
            {savings}
          </span>
        </div>
      )}

      {marketValue && (
        <p className="text-sm text-gray-600 mb-6">
          <span className="font-medium">Comparable value:</span> {marketValue}
        </p>
      )}

      <ul className="flex-1 mb-6 space-y-3 text-gray-700 list-disc list-inside">
        {features.map((feature, i) => (
          <li key={i}>{feature}</li>
        ))}
      </ul>

      <button
        className={`mt-auto py-3 rounded-lg font-semibold transition-colors ${
          highlight
            ? "bg-[#FF7043] hover:bg-[#F4511E] text-white"
            : "bg-[#FF7043] hover:bg-[#F4511E] text-white"
        }`}
      >
        {buttonText}
      </button>

      <p className="mt-4 text-xs text-gray-500">
        * Savings estimates vs. buying separate tools (e.g., LinkedIn, calendaring, resume/ATS, trackers).
      </p>
    </div>
  );
}

export default function PricingPlans() {
  const plans = [
    {
      title: "Free",
      price: "$0",
      period: "month",
      features: [
        "Access to Smart Job Board",
        "Basic Feed Filters",
        "Private Profile Notes",
        "Custom Profile Themes",
        "Ethical Data Use Guaranteed",
      ],
      marketValue: "Comparable tools $20+/mo",
      savings: "Save 100%",
      highlight: false,
      buttonText: "Get Started",
    },
    {
      title: "Job Seeker Pro",
      price: "$9.99",
      period: "month",
      features: [
        "Unlimited Applications & Messaging",
        "ATS Resume & Cover Letter Builder",
        "Career Calendar & Application Tracker",
        "AI Interview Prep & Career Roadmaps",
        "Profile Insights",
      ],
      marketValue: "Valued at $60–$80/mo elsewhere",
      savings: "Save ~85–90% vs separate tools",
      highlight: true,
      buttonText: "Upgrade Now",
    },
    {
      title: "Coaches / Mentors",
      price: "$39.99",
      period: "month",
      features: [
        "Client Session Scheduling & Notes",
        "Portfolio Showcase & Testimonials",
        "Unlimited Verified Messaging",
        "Community Event Hosting",
      ],
      marketValue: "Valued at $100+/mo elsewhere",
      savings: "Save ~60%+ vs separate tools",
      highlight: false,
      buttonText: "Upgrade Now",
    },
    {
      title: "Small Business",
      price: "$99.99",
      period: "month",
      features: [
        "5 Active Job Postings",
        "Unlimited Candidate Browsing",
        "Bulk Messaging (limited)",
        "Hiring Analytics Dashboard",
      ],
      marketValue: "Valued at $300–$700/mo elsewhere",
      savings: "Save ~65–85% vs separate tools",
      highlight: false,
      buttonText: "Upgrade Now",
    },
    {
      title: "Enterprise Business",
      price: null,
      period: null,
      features: [
        "Unlimited Job Postings",
        "Unlimited Messaging Campaigns",
        "Advanced Hiring Analytics",
        "Dedicated Account Manager",
        "Custom Integrations",
      ],
      marketValue: "Valued at $8,000+/yr elsewhere",
      savings: "Typically 50%+ lower TCO",
      highlight: false,
      buttonText: "Contact Sales",
    },
  ];

  const top = plans.slice(0, 3);
  const bottom = plans.slice(3);

  return (
    <div className="space-y-8">
      {/* Row 1: 3 cards */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {top.map((p, i) => (
          <Card key={`top-${i}`} {...p} />
        ))}
      </div>

      {/* Row 2: 2 cards, centered */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 justify-items-center">
        {bottom.map((p, i) => (
          <div key={`bot-${i}`} className="w-full max-w-[28rem]">
            <Card {...p} />
          </div>
        ))}
      </div>
    </div>
  );
}

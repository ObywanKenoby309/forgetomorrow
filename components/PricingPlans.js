// components/PricingPlans.js
export default function PricingPlans() {
  const plans = [
    {
      title: 'Free',
      price: '$0',
      period: 'month',
      features: [
        'Smart Job Board access',
        'Smart Feed Filters',
        'Private Profile Notes',
        'Custom Profile Themes',
        'Ethical Data Use',
        'TrueEndorse Endorsements',
      ],
      highlight: false,
      buttonText: 'Get Started',
    },
    {
      title: 'Job Seeker',
      price: '$29.99',
      period: 'month',
      features: [
        '5 InMail credits per month',
        'See who viewed your profile (last year)',
        'Open Profiles',
        'Top Applicant Job Recommendations',
        'Company Insights',
        'Resume Insights',
        'Access to 22,000+ Learning Courses',
        'Full Interview Prep Tools',
      ],
      highlight: true,
      buttonText: 'Upgrade Now',
    },
    {
      title: 'Coaches / Mentors',
      price: '$29.99',
      period: 'month',
      features: [
        '5 InMail credits per month',
        'See who viewed your profile (last year)',
        'Open Profiles',
        'Top Applicant Job Recommendations',
        'Company Insights',
        'Resume Insights',
        'Access to 22,000+ Learning Courses',
        'Full Interview Prep Tools',
      ],
      highlight: true,
      buttonText: 'Upgrade Now',
    },
    {
      title: 'Small Business',
      price: '$34.99',
      period: 'month',
      features: [
        '15 InMail credits per month',
        'Unlimited people browsing',
        'See who viewed your profile (last year)',
        'Open Profiles',
        'Top Applicant Job Recommendations',
        'Company Insights',
        'Resume Insights',
        'Access to 22,000+ Learning Courses',
        'Full Interview Prep Tools',
      ],
      highlight: false,
      buttonText: 'Upgrade Now',
    },
    {
      title: 'Enterprise Business',
      price: '$34.99',
      period: 'month',
      features: [
        '15 InMail credits per month',
        'Unlimited people browsing',
        'See who viewed your profile (last year)',
        'Open Profiles',
        'Top Applicant Job Recommendations',
        'Company Insights',
        'Resume Insights',
        'Access to 22,000+ Learning Courses',
        'Full Interview Prep Tools',
      ],
      highlight: false,
      buttonText: 'Upgrade Now',
    },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-5">
      {plans.map(({ title, price, period, features, highlight, buttonText }, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-lg shadow p-6 flex flex-col ${
            highlight ? 'border-4 border-[#FF7043]' : ''
          }`}
        >
          <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">{title}</h2>
          <p className="text-4xl font-bold mb-6">
            {price} <span className="text-base font-normal">/ {period}</span>
          </p>
          <ul className="flex-1 mb-6 space-y-3 text-gray-700 list-disc list-inside">
            {features.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
          <button
            className={`mt-auto py-3 rounded-lg font-semibold transition-colors ${
              highlight
                ? 'bg-[#FF7043] hover:bg-[#F4511E] text-white'
                : 'bg-[#FF7043] hover:bg-[#F4511E] text-white'
            }`}
          >
            {buttonText}
          </button>
        </div>
      ))}
    </div>
  );
}

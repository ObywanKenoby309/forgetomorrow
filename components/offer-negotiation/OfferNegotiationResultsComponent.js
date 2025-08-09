import React from 'react';

export default function OfferNegotiationResultsComponent({ formData }) {
  // Mock AI-generated negotiation advice
  const generateMockFeedback = (form) => {
    if (!form) return 'Loading...';

    return `
Based on your current job title of "${form.currentJobTitle}" and the offered position "${form.jobDescription}", here's a strategic overview for your negotiation:

- Market Value: Research indicates that for similar roles in ${form.location}, the average salary range is between $${form.targetSalaryMin || 'N/A'} and $${form.targetSalaryMax || 'N/A'}. Ensure your target aligns within this range.

- Total Compensation: Don't focus solely on salary; consider benefits like ${form.desiredBenefits || 'standard benefits'}, bonuses, and work flexibility.

- Job Type & Industry: As this is a ${form.jobType || 'standard'} position in the ${form.industry || 'relevant'} sector, tailor your negotiation to industry norms.

- Current Salary: Your current salary is $${form.currentSalary}. Aim for an increase that justifies your experience and the responsibilities of the new role.

Remember to confidently articulate your value, be ready to discuss non-salary benefits, and clarify any unclear contract terms. Good luck!

    `;
  };

  const aiFeedback = generateMockFeedback(formData);

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6 whitespace-pre-line">
      <h2 className="text-xl font-semibold">Summary</h2>
      <p>{aiFeedback}</p>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          disabled
          className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
        >
          Download PDF (coming soon)
        </button>
        <button
          disabled
          className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
        >
          Download Word (coming soon)
        </button>
        <button
          disabled
          className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
        >
          Download Text (coming soon)
        </button>
      </div>
    </div>
  );
}

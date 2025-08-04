// components/FeaturesList.js
import React from 'react';

export default function FeaturesList({ features = [] }) {
  return (
    <ul className="max-w-xl mx-auto list-disc list-inside space-y-4 text-lg leading-relaxed">
      {features.map((feature, index) => (
        <li key={index} className="text-[#ff4500] font-semibold">
          {feature}
        </li>
      ))}
    </ul>
  );
}

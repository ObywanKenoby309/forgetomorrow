// components/FeaturesList.js
import React from 'react';

export default function FeaturesList({ features = [] }) {
  return (
    <ul className="max-w-2xl mx-auto space-y-6 text-lg leading-relaxed text-center text-gray-200">
      {features.map((feature, index) => (
        <li key={index}>
          {feature}
        </li>
      ))}
    </ul>
  );
}

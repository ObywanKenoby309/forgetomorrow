// components/coaching/CoachFeedback.js
//
// Thin page wrapper — renders FeedbackModule inside CoachingLayout.
// Direct URL navigation (/dashboard/coaching/feedback) still works.
// All logic lives in components/coaching/modules/FeedbackModule.js.
import React from 'react';
import FeedbackModule from '@/components/coaching/modules/FeedbackModule';


export default function CoachFeedback() {
  return <FeedbackModule />;
}

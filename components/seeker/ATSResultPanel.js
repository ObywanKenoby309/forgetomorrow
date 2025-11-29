// components/seeker/ATSResultPanel.js
// Floating ATS result card for job seekers (overlay + click-outside close)

import React from 'react';

export default function ATSResultPanel({
  open,
  onClose,
  loading,
  error,
  result,
  onImproveResume,
}) {
  if (!open) return null;

  const hasResult = !!result && !loading && !error;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'transparent', // invisible click-catcher
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 32,
          bottom: 96,
          width: '100%',
          maxWidth: 420,
          maxHeight: '60vh',
          overflowY: 'auto',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 18px 45px rgba(0,0,0,0.35)',
          border: '1px solid #ECEFF1',
          padding: 16,
          fontSize: 13,
          color: '#37474F',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: '#263238',
            }}
          >
            ATS Alignment Result
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ATS alignment result"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              color: '#90A4AE',
            }}
          >
            ×
          </button>
        </div>

        {/* Body states */}
        {loading && (
          <p
            style={{
              margin: 0,
              color: '#90A4AE',
            }}
          >
            Running ATS alignment…
          </p>
        )}

        {!loading && error && (
          <p
            style={{
              margin: 0,
              color: '#D32F2F',
            }}
          >
            {error}
          </p>
        )}

        {!loading && !error && !result && (
          <p
            style={{
              margin: 0,
              color: '#90A4AE',
              fontStyle: 'italic',
            }}
          >
            Run ATS Alignment to see how well your profile matches this job and
            get tailored resume suggestions.
          </p>
        )}

        {!loading && !error && result && (
          <>
            {/* Score */}
            {typeof result.score === 'number' && (
              <div style={{ marginTop: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Estimated match score:</span>{' '}
                {result.score}%
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div style={{ marginTop: 4 }}>
                <span style={{ fontWeight: 600 }}>Summary:</span>{' '}
                {result.summary}
              </div>
            )}

            {/* Recommendations */}
            {Array.isArray(result.recommendations) &&
              result.recommendations.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Recommended resume improvements:
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                    }}
                  >
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Improve Resume CTA */}
            {typeof onImproveResume === 'function' && (
              <button
                type="button"
                onClick={onImproveResume}
                style={{
                  marginTop: 12,
                  width: '100%',
                  background: '#1A4B8F', // Steel Azure
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 700,
                  cursor: hasResult ? 'pointer' : 'default',
                  fontSize: 13,
                  opacity: hasResult ? 1 : 0.6,
                }}
                disabled={!hasResult}
              >
                Improve my resume with Grok + OpenAI →
              </button>
            )}

            <p
              style={{
                marginTop: 6,
                marginBottom: 0,
                fontSize: 11,
                color: '#90A4AE',
              }}
            >
              AI-assisted guidance. You control what gets added to your resume
              before you apply.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

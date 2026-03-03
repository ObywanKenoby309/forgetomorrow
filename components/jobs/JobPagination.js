// components/jobs/JobPagination.js
import React from 'react';

export default function JobPagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const windowSize = 3;
  const startPage  = Math.max(1, currentPage - windowSize);
  const endPage    = Math.min(totalPages, currentPage + windowSize);
  const pageNumbers = [];
  for (let p = startPage; p <= endPage; p++) pageNumbers.push(p);

  const btnBase = {
    padding: '5px 10px', borderRadius: 8,
    border: '1px solid #CFD8DC', fontSize: 12,
    cursor: 'pointer', fontWeight: 600,
    transition: 'all 120ms ease',
  };

  return (
    <nav
      aria-label="Job results pagination"
      style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 4, paddingTop: 8, flexWrap: 'wrap',
      }}
    >
      <button type="button" disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        style={{ ...btnBase, background: currentPage === 1 ? '#ECEFF1' : 'white', color: currentPage === 1 ? '#B0BEC5' : '#546E7A', cursor: currentPage === 1 ? 'default' : 'pointer' }}
        aria-label="First page">
        «
      </button>

      {startPage > 1 && <span style={{ color: '#B0BEC5', fontSize: 12 }}>…</span>}

      {pageNumbers.map(p => (
        <button key={p} type="button" onClick={() => onPageChange(p)}
          style={{
            ...btnBase,
            background: p === currentPage ? '#FF7043' : 'white',
            color: p === currentPage ? 'white' : '#263238',
            borderColor: p === currentPage ? '#FF7043' : '#CFD8DC',
            cursor: p === currentPage ? 'default' : 'pointer',
          }}
          aria-current={p === currentPage ? 'page' : undefined}
          aria-label={`Page ${p}`}>
          {p}
        </button>
      ))}

      {endPage < totalPages && <span style={{ color: '#B0BEC5', fontSize: 12 }}>…</span>}

      <button type="button" disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        style={{ ...btnBase, background: currentPage === totalPages ? '#ECEFF1' : 'white', color: currentPage === totalPages ? '#B0BEC5' : '#546E7A', cursor: currentPage === totalPages ? 'default' : 'pointer' }}
        aria-label="Last page">
        »
      </button>
    </nav>
  );
}
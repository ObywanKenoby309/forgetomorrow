// components/coaching/dashboard/ClientsTable.js
import React from 'react';
import Link from 'next/link';

function getStatusStyles(status) {
  if (status === 'At Risk') return { background: '#FDECEA', color: '#C62828' };
  if (status === 'New Intake') return { background: '#E3F2FD', color: '#1565C0' };
  return { background: '#E8F5E9', color: '#2E7D32' };
}

export default function ClientsTable({ clients = [], linkHref = '/dashboard/coaching/clients' }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ color: '#FF7043', fontWeight: 700, fontSize: 18 }}>Clients</div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Next Session</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const { background, color } = getStatusStyles(c.status);
              return (
                <tr key={c.name} style={{ borderTop: '1px solid #eee' }}>
                  <Td strong>{c.name}</Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 12,
                        background,
                        color,
                        padding: '4px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {c.status}
                    </span>
                  </Td>
                  <Td>{c.next}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'right', marginTop: 10 }}>
        <Link href={linkHref} style={{ color: '#FF7043', fontWeight: 600 }}>
          View all clients
        </Link>
      </div>
    </section>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        fontSize: 13,
        color: '#546E7A',
        borderBottom: '1px solid #eee',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, strong = false }) {
  return (
    <td
      style={{
        padding: '10px 12px',
        fontSize: 14,
        color: '#37474F',
        fontWeight: strong ? 600 : 400,
        background: 'white',
      }}
    >
      {children}
    </td>
  );
}

// components/RequestList.js
import React, { useState, useMemo } from 'react';

export default function RequestList({
  incomingRequests = [],
  outgoingRequests = [],
  onAccept,
  onDecline,
  onCancel,
}) {
  // Collapsible state (default: collapsed)
  const [showIncoming, setShowIncoming] = useState(false);
  const [showOutgoing, setShowOutgoing] = useState(false);

  // Counts (for badges on headers)
  const incomingCount = useMemo(() => incomingRequests.length, [incomingRequests]);
  const outgoingCount = useMemo(() => outgoingRequests.length, [outgoingRequests]);

  return (
    <div>
      {/* Incoming Requests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Incoming Requests</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {incomingCount}
            </span>
            <button
              type="button"
              className="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
              onClick={() => setShowIncoming((v) => !v)}
              aria-expanded={showIncoming}
              aria-controls="incoming-requests-panel"
            >
              {showIncoming ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div
          id="incoming-requests-panel"
          className={`${showIncoming ? 'block' : 'hidden'}`}
        >
          <ul className="space-y-3 max-h-48 overflow-y-auto">
            {incomingRequests.length === 0 ? (
              <li className="text-gray-500 italic">No incoming requests</li>
            ) : (
              incomingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded border border-gray-300"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={req.photo}
                      alt={`${req.name} Photo`}
                      className="rounded-full border-2 border-[#FF7043]"
                    />
                    <p className="font-medium">{req.name}</p>
                  </div>
                  <div className="space-x-3">
                    <button
                      className="bg-[#FF7043] text-white px-3 py-1 rounded hover:bg-[#F4511E]"
                      onClick={() => onAccept(req)}
                      aria-label={`Accept request from ${req.name}`}
                    >
                      Accept
                    </button>
                    <button
                      className="border border-gray-400 px-3 py-1 rounded hover:bg-gray-100"
                      onClick={() => onDecline(req)}
                      aria-label={`Decline request from ${req.name}`}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Outgoing Requests */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Outgoing Requests</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {outgoingCount}
            </span>
            <button
              type="button"
              className="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
              onClick={() => setShowOutgoing((v) => !v)}
              aria-expanded={showOutgoing}
              aria-controls="outgoing-requests-panel"
            >
              {showOutgoing ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div
          id="outgoing-requests-panel"
          className={`${showOutgoing ? 'block' : 'hidden'}`}
        >
          <ul className="space-y-3 max-h-48 overflow-y-auto">
            {outgoingRequests.length === 0 ? (
              <li className="text-gray-500 italic">No outgoing requests</li>
            ) : (
              outgoingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded border border-gray-300"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={req.photo}
                      alt={`${req.name} Photo`}
                      className="rounded-full border-2 border-[#FF7043]"
                    />
                    <p className="font-medium">{req.name}</p>
                  </div>
                  <button
                    className="border border-gray-400 px-3 py-1 rounded hover:bg-gray-100"
                    onClick={() => onCancel(req)}
                    aria-label={`Cancel request to ${req.name}`}
                  >
                    Cancel
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

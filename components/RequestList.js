// components/RequestList.jsx
import React from 'react';

/**
 * RequestList
 *
 * Props:
 * - incomingRequests: Array<{ id, name, photo }>
 * - outgoingRequests: Array<{ id, name, photo }>
 * - onAccept?:      (req) => void
 * - onDecline?:     (req) => void
 * - onCancel?:      (req) => void
 * - onBulkAccept?:  (list) => void    // approve all incoming
 * - onBulkCancel?:  (list) => void    // cancel all outgoing
 */
export default function RequestList({
  incomingRequests = [],
  outgoingRequests = [],
  onAccept,
  onDecline,
  onCancel,
  onBulkAccept,
  onBulkCancel,
}) {
  const showIncoming = (incomingRequests?.length ?? 0) > 0 || onBulkAccept;
  const showOutgoing = (outgoingRequests?.length ?? 0) > 0 || onBulkCancel;

  return (
    <div className="grid gap-6">
      {/* Incoming */}
      {showIncoming && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Incoming Requests</h3>
            {!!incomingRequests.length && typeof onBulkAccept === 'function' && (
              <button
                className="text-sm px-3 py-1 rounded-md bg-[#FF7043] text-white hover:bg-[#F4511E]"
                onClick={() => onBulkAccept(incomingRequests)}
              >
                Approve All
              </button>
            )}
          </div>

          <ul className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {incomingRequests.length === 0 ? (
              <li className="text-gray-500 italic">No incoming requests</li>
            ) : (
              incomingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded border border-gray-300 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.photo}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-[#FF7043] object-cover"
                    />
                    <p className="font-medium">{req.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-[#FF7043] text-white px-3 py-1 rounded hover:bg-[#F4511E]"
                      onClick={() => onAccept?.(req)}
                    >
                      Accept
                    </button>
                    <button
                      className="border border-gray-400 px-3 py-1 rounded hover:bg-gray-100"
                      onClick={() => onDecline?.(req)}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      {/* Outgoing */}
      {showOutgoing && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Outgoing Requests</h3>
            {!!outgoingRequests.length && typeof onBulkCancel === 'function' && (
              <button
                className="text-sm px-3 py-1 rounded-md border border-gray-400 hover:bg-gray-100"
                onClick={() => onBulkCancel(outgoingRequests)}
              >
                Cancel All
              </button>
            )}
          </div>

          <ul className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {outgoingRequests.length === 0 ? (
              <li className="text-gray-500 italic">No outgoing requests</li>
            ) : (
              outgoingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded border border-gray-300 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.photo}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-[#FF7043] object-cover"
                    />
                    <p className="font-medium">{req.name}</p>
                  </div>
                  <button
                    className="border border-gray-400 px-3 py-1 rounded hover:bg-gray-100"
                    onClick={() => onCancel?.(req)}
                  >
                    Cancel
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  );
}

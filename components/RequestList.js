// components/RequestList.js
export default function RequestList({
  incomingRequests = [],
  outgoingRequests = [],
  onAccept,
  onDecline,
  onCancel,
}) {
  return (
    <div>
      {/* Incoming Requests */}
      <div>
        <h3 className="font-semibold mb-2 text-gray-800">Incoming Requests</h3>
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

      {/* Outgoing Requests */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2 text-gray-800">Outgoing Requests</h3>
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
  );
}

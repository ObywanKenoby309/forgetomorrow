// components/coaching/CoachCalendar.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import CoachingSessionsCalendarInterface from "@/components/calendar/CoachingSessionsCalendarInterface";
import CalendarDayPanel from "@/components/calendar/CalendarDayPanel";

const API_URL = "/api/coaching/sessions";

function mapRowsToEvents(rows) {
  return rows.map((session) => {
    const date = session.date || session.sessionDate || null;
    const time = session.time || session.sessionTime || "09:00";
    const timezone =
      session.timezone ||
      session.foundryTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "America/New_York";
    const client =
      session.client ||
      session.clientName ||
      session.client_name ||
      "";

    const clientUserId =
      typeof session.clientId === "string" && session.clientId.length > 0
        ? session.clientId
        : session.clientUserId || null;

    const explicitClientType =
      session.clientType === "internal" || session.clientType === "external"
        ? session.clientType
        : null;

    const clientType =
      explicitClientType || (clientUserId ? "internal" : "external");

    return {
      id: session.id,
      date,
      time,
      timezone,
      client,
      title: client,
      clientType,
      clientUserId,
      type: session.type || "Strategy",
      status: session.status || "Scheduled",
      notes: session.notes || "",
      enableVideo:
        !!session.enableVideo ||
        !!session.foundryRoomId ||
        String(session.notes || "").includes("Foundry room:"),
      foundryRoomId: session.foundryRoomId || null,
      foundryGuestToken: session.foundryGuestToken || null,
      foundryJoinUrl: session.foundryJoinUrl || null,
      foundryGuestJoinUrl: session.foundryGuestJoinUrl || null,
      foundryScheduledAt: session.foundryScheduledAt || null,
      foundryTimezone: session.foundryTimezone || null,
      source: session.source || "coach",
    };
  });
}

export default function CoachCalendar() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const calendarRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        console.error("Failed to load coaching sessions for calendar");
        setSessions([]);
        return;
      }

      const data = await response.json().catch(() => ({}));
      const rows = Array.isArray(data) ? data : data.sessions || [];
      const mapped = mapRowsToEvents(rows);

      setSessions(mapped);

      setDayEvents((current) => {
        if (!selectedDate) return current;
        return mapped.filter((event) => event.date === selectedDate);
      });
    } catch (error) {
      console.error("Error loading sessions for calendar:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDaySelect = useCallback((dateString, events) => {
    setSelectedDate(dateString);
    setDayEvents(events || []);
  }, []);

  const handleAdd = useCallback((dateString) => {
    calendarRef.current?.openAdd?.(dateString);
  }, []);

  const handleEdit = useCallback((id) => {
    calendarRef.current?.openEdit?.(id);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 280px)",
        gap: 16,
        width: "100%",
        alignItems: "start",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <CoachingSessionsCalendarInterface
          ref={calendarRef}
          title={loading ? "Sessions Calendar (loading…)" : "Sessions Calendar"}
          events={sessions}
          onRefresh={loadSessions}
          onDaySelect={handleDaySelect}
          selectedDate={selectedDate}
        />
      </div>

      <aside style={{ minWidth: 0 }}>
        <CalendarDayPanel
          selectedDate={selectedDate}
          events={dayEvents}
          onAdd={handleAdd}
          onEdit={handleEdit}
          context="coaching"
        />
      </aside>

      <style jsx>{`
        @media (max-width: 1023px) {
          div {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

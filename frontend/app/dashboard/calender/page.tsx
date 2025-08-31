"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import { motion, AnimatePresence } from "framer-motion";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/app/styles/calendar.css";

import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import useSubscription from "../../lib/useSubscription";
import { useSequences } from "../../lib/useSequences";

type EventType = {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
  subject: string;
  to_email: string[] | string;
  recurrence: string;
  [key: string]: any;
  };
};

export default function CalendarPage() {
  const { loading, abonnementActif, type_Abonnement } = useSubscription();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventType[]>([]);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});

  const router = useRouter();
  const { sequences, loading: loadingSequences } = useSequences(userId);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
    };
    fetchUser();
  }, [router]);

  // Génération des événements en tenant compte des récurrences
  useEffect(() => {
    if (!sequences) return;

    const startWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
    const generated: EventType[] = [];

    sequences.forEach(seq => {
      const recurrence = seq.recurrence || "none";
      const firstDate = new Date(seq.scheduled_at);
      let nextDate = new Date(firstDate);

      const intervalFn: Record<string, (d: Date) => Date> = {
        daily: (d) => new Date(d.getTime() + 24*60*60*1000),
        weekly: (d) => new Date(d.getTime() + 7*24*60*60*1000),
        monthly: (d) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        yearly: (d) => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()),
      };

      const recurFn = intervalFn[recurrence];

      if (!recurFn) {
        if (firstDate >= startWindow && firstDate <= endWindow) {
          generated.push({
            title: seq.subject,
            start: firstDate,
            end: new Date(firstDate.getTime() + 60*60*1000),
            allDay: false,
            resource: seq,
          });
        }
      } else {
        while (nextDate <= endWindow) {
          if (nextDate >= startWindow) {
            generated.push({
              title: seq.subject,
              start: new Date(nextDate),
              end: new Date(nextDate.getTime() + 60*60*1000),
              allDay: false,
              resource: seq,
            });
          }
          nextDate = recurFn(nextDate);
        }
      }
    });

    // Compter les événements par date
    const countsByDate: Record<string, number> = {};
    generated.forEach(ev => {
      const key = ev.start.toDateString();
      countsByDate[key] = (countsByDate[key] || 0) + 1;
    });

    setEventCounts(countsByDate);
    setEvents(generated);
  }, [sequences, currentDate]);

  const handleSelectSlot = (slotInfo: { start: Date }) => {
    const clickedDate = slotInfo.start.toDateString();
    const dayEvents = events.filter(ev => ev.start.toDateString() === clickedDate);
    setSelectedDayEvents(dayEvents);
    setModalDate(slotInfo.start);
  };

  if (loading || loadingSequences) {
    return <p className="text-center text-gray-500 dark:text-gray-300">⏳ Loading sequences...</p>;
  }

  const abonnementsAutorises = ["premium", "ultimate"];
  if (!abonnementActif || !abonnementsAutorises.includes(type_Abonnement)) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔒 Restricted Access</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          This feature is available only for <strong>Premium</strong> or <strong>Ultimate</strong> plans.
        </p>
        <a href="/dashboard/billing" className="inline-block mt-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow">
          Upgrade Your Plan 💳
        </a>
      </div>
    );
  }

  const MyEvent = ({ event }: { event: EventType }) => (
    <div className="bg-gradient-to-r from-indigo-900 to-fuchsia-500 text-white rounded-md px-2 py-1 text-xs shadow-md hover:scale-105 transition-transform font-semibold">
      {event.title}
    </div>
  );

  const CustomDateCellWrapper = ({ value, children }: any) => {
    const key = value.toDateString();
    const count = eventCounts[key] || 0;
    return (
      <div className="relative group hover:bg-pink-50 dark:hover:bg-pink-900 transition-all duration-200">
        {children}
        {count > 0 && (
          <>
            <span className="absolute top-1 right-1 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 shadow-md">
              {count}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="bg-indigo-600 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white font-poppins mt-4">
        Sequences Calendar
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="dayGridMonth"
          locale="en"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height={600}
          selectable
          events={events.map(ev => ({
            title: ev.title,
            start: ev.start,
            end: ev.end,
            extendedProps: ev.resource,
            allDay: ev.allDay,
          }))}
          dateClick={(arg) => handleSelectSlot({ start: arg.date })}
          datesSet={({ start }) => setCurrentDate(new Date(start))}
          eventContent={(arg) => (
            <div className="truncate px-1 py-0.5 rounded text-xs font-medium bg-indigo-900 text-white shadow-sm">
              {arg.event.title}
            </div>
          )}
          dayMaxEvents={3}
          moreLinkClick={(arg) => {
            handleSelectSlot({ start: arg.date });
            return "popover";
          }}
        />
      </div>

      <button
        onClick={() => setCurrentDate(new Date())}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-pink-700 text-white p-4 rounded-full shadow-lg transition-all z-50"
      >
        Back to Today
      </button>

      <AnimatePresence>
        {modalDate && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-xl w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
              <button
                className="absolute top-3 right-3 text-xl text-gray-600 dark:text-gray-300 hover:text-red-600"
                onClick={() => setModalDate(null)}
              >
                ✖
              </button>

              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Sequences planned for: {modalDate.toLocaleDateString("en-US")}
              </h2>

              {selectedDayEvents.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-300">
                  No planned sequences. Create one in the Dashboard.
                </p>
              ) : (
                Object.entries(
                  selectedDayEvents.reduce((acc, event) => {
                    const subject = event.resource.subject;
                    acc[subject] = acc[subject] || [];
                    acc[subject].push(event);
                    return acc;
                  }, {} as Record<string, EventType[]>)
                ).map(([subject, group], i) => (
                  <div key={i} className="mb-4">
                    <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-400">
                      {subject}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {group.map((event, idx) => {
                        const emails = Array.isArray(event.resource.to_email)
                          ? event.resource.to_email
                          : event.resource.to_email
                            ? event.resource.to_email.split(",").map(e => e.trim())
                            : [];

                        const displayEmails = emails.slice(0, 4);
                        const remaining = emails.length - displayEmails.length;

                        return (
                          <li
                            key={idx}
                            className="border-l-4 border-indigo-900 pl-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                          >
                            <p className="text-sm text-gray-700 dark:text-white">
                              📩 To:{" "}
                              {event.resource.to_email.length > 0 ? (
                                <>
                                  {displayEmails.join(", ")}
                                  {remaining > 0 && (
                                    <span>
                                      {" "}And {remaining > 99 ? "+99" : remaining} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <em>No emails specified</em>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 italic">
                              🔁 Recurrence: {event.resource.recurrence || "None"}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
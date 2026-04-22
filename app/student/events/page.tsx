"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsArray as any);
    }, (error) => {
      console.error("Error fetching events: ", error);
      toast.error("Failed to load events", {
        theme: "dark",
        position: "bottom-center",
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-black p-8">
      <div className="p-6 max-w-3xl mx-auto bg-gray-900 text-gray-200 rounded-md shadow-md">
        <h1 className="text-2xl font-semibold mb-4">Event List</h1>
        {events.length > 0 ? (
          <ul className="space-y-4">
            {events.map((event: { id: string; eventTitle: string; eventDescription: string; user: string; eventDate: string }) => (
              <li key={event.id} className="p-4 border border-gray-700 rounded-md bg-gray-800">
                <h2 className="text-xl font-semibold">{event.eventTitle}</h2>
                <p className="text-gray-400">{event.eventDescription}</p>
                <p className="text-sm text-gray-500 mt-2">By: {event.user} | Date: {event.eventDate}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No events found.</p>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default EventsPage;
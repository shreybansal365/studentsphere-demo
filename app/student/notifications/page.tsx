"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function NotificationReceiver() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time updates for notifications
  useEffect(() => {
    const notificationsRef = collection(db, "notifications");
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter notifications based on search query
  const filteredNotifications = notifications.filter((notification) => {
    const title = notification.title?.toLowerCase() || "";
    const message = notification.message?.toLowerCase() || "";
    const instructor = notification.instructor?.toLowerCase() || "";

    return (
      title.includes(searchQuery.toLowerCase()) ||
      message.includes(searchQuery.toLowerCase()) ||
      instructor.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <section className="bg-black min-h-screen flex flex-col p-6 text-white">
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-6">Notifications</h2>

        {/* Search Filter */}
        <div className="mb-6 p-4 bg-gray-900 shadow-md rounded-lg">
          <input
            type="text"
            placeholder="Search Notifications"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-md bg-gray-800 text-white"
          />
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-center text-gray-400">No notifications available.</p>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="bg-gray-900 shadow-lg rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold">{notification.title}</h3>
                <p className="mt-2">{notification.message}</p>
                <p className="mt-2 text-gray-400">Instructor: {notification.instructor}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

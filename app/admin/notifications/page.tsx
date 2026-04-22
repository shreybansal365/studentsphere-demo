"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Loader2, Trash2, Edit, PlusCircle, Save } from "lucide-react";

export default function NotificationReceiver() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newInstructor, setNewInstructor] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Real-time updates for notifications
  useEffect(() => {
    const notificationsRef = collection(db, "notifications");
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new notification
  const handleAddNotification = async () => {
    if (!newTitle || !newMessage || !newInstructor) return;
    await addDoc(collection(db, "notifications"), {
      title: newTitle,
      message: newMessage,
      instructor: newInstructor,
      timestamp: new Date(),
    });
    resetForm();
  };

  // Edit existing notification
  const handleEditNotification = async () => {
    if (!editId || !newTitle || !newMessage || !newInstructor) return;
    await updateDoc(doc(db, "notifications", editId), {
      title: newTitle,
      message: newMessage,
      instructor: newInstructor,
    });
    resetForm();
  };

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  // Reset input fields
  const resetForm = () => {
    setNewTitle("");
    setNewMessage("");
    setNewInstructor("");
    setEditId(null);
  };

  return (
    <section className="bg-black min-h-screen flex flex-col p-6 text-white">
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-6">Notifications</h2>

        {/* Add/Edit Notification */}
        <div className="mb-6 p-4 bg-gray-900 shadow-md rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Add/Edit Notification</h3>
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-md mb-2 bg-gray-800 text-white"
          />
          <textarea
            placeholder="Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full px-4 py-2 border rounded-md mb-2 bg-gray-800 text-white"
          />
          <input
            type="text"
            placeholder="Instructor"
            value={newInstructor}
            onChange={(e) => setNewInstructor(e.target.value)}
            className="w-full px-4 py-2 border rounded-md mb-2 bg-gray-800 text-white"
          />
          <button
            onClick={editId ? handleEditNotification : handleAddNotification}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center w-full"
          >
            {editId ? <Save size={20} className="mr-2" /> : <PlusCircle size={20} className="mr-2" />}
            {editId ? "Update" : "Add"} Notification
          </button>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-400">No notifications available.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-gray-900 shadow-lg rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold">{notification.title}</h3>
                <p className="mt-2">{notification.message}</p>
                <p className="mt-2 text-gray-400">Instructor: {notification.instructor}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditId(notification.id);
                      setNewTitle(notification.title);
                      setNewMessage(notification.message);
                      setNewInstructor(notification.instructor);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md flex items-center"
                  >
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

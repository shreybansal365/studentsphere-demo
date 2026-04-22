"use client";
import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment-timezone";

function Page() {
  const [formData, setFormData] = useState({
    user: "",
    eventTitle: "",
    eventDescription: "",
    eventDate: "",
    session: "Morning",
  });
  const [error, setError] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.user.trim()) errors.user = "User is required";
    if (!formData.eventTitle.trim()) errors.eventTitle = "Event title is required";
    if (!formData.eventDescription.trim()) errors.eventDescription = "Event description is required";
    if (!formData.eventDate.trim()) errors.eventDate = "Event date is required";

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const currentDate = moment().tz("Asia/Kolkata");
    const date = currentDate.format("YYYY-MM-DD");
    const time = currentDate.format("HH:mm:ss");

    try {
      await addDoc(collection(db, "events"), {
        ...formData,
        createdDate: date,
        createdTime: time,
      });
      toast.success("Event added successfully!", {
        theme: "dark",
        position: "bottom-center",
      });
      setFormData({
        user: "",
        eventTitle: "",
        eventDescription: "",
        eventDate: "",
        session: "Morning",
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      toast.error("Failed to add event", {
        theme: "dark",
        position: "bottom-center",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="bg-black p-8">
      <div className="p-6 max-w-3xl mx-auto bg-gray-900 text-gray-200 rounded-md shadow-md">
        <h1 className="text-2xl font-semibold mb-4">Add Event</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block">User</label>
            <input
              type="text"
              name="user"
              value={formData.user}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
            />
            {error.user && <p className="text-red-500 text-sm">{error.user}</p>}
          </div>

          <div>
            <label className="block">Event Title</label>
            <input
              type="text"
              name="eventTitle"
              value={formData.eventTitle}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
            />
            {error.eventTitle && <p className="text-red-500 text-sm">{error.eventTitle}</p>}
          </div>

          <div>
            <label className="block">Event Description</label>
            <textarea
              name="eventDescription"
              value={formData.eventDescription}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
              rows={3}
            ></textarea>
            {error.eventDescription && <p className="text-red-500 text-sm">{error.eventDescription}</p>}
          </div>

          <div>
            <label className="block">Event Date</label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
            />
            {error.eventDate && <p className="text-red-500 text-sm">{error.eventDate}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-gray-200 px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-500"
          >
            Submit
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Page;

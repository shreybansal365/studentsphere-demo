"use client";
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaBook, FaCode, FaVideo, FaStickyNote } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Resource {
  id: string;
  title: string;
  category: "notes" | "code" | "videos" | "textbooks";
  sourceLink: string;
  instructor: string;
  date: string;
  courseCode: string;
  batch: string;
}

const AdminPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Resource, "id">>({
    title: "",
    category: "notes",
    sourceLink: "",
    instructor: "",
    date: "",
    courseCode: "",
    batch: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);

  const db = getFirestore(app);
  const resourcesRef = collection(db, "resources");

  useEffect(() => {
    const unsubscribe = onSnapshot(resourcesRef, (snapshot) => {
      setResources(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resource)));
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formData).some((val) => !val)) {
      alert("Please fill all fields");
      return;
    }
    setIsUploading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "resources", editId), { ...formData });
        setEditId(null);
      } else {
        await addDoc(resourcesRef, { ...formData, createdAt: serverTimestamp() });
      }
      setFormData({
        title: "",
        category: "notes",
        sourceLink: "",
        instructor: "",
        date: "",
        courseCode: "",
        batch: "",
      });
      setShowForm(false);
    } catch (error) {
      alert("Operation failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData(resource);
    setEditId(resource.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      await deleteDoc(doc(db, "resources", id));
    }
  };

  const categorizedResources = {
    notes: resources.filter((res) => res.category === "notes"),
    code: resources.filter((res) => res.category === "code"),
    videos: resources.filter((res) => res.category === "videos"),
    textbooks: resources.filter((res) => res.category === "textbooks"),
  };

  return (
    <section className="p-6 min-h-screen bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resources</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="bg-blue-600 px-4 py-2 rounded-md flex items-center"
        >
          {showForm ? <FaTimes /> : <><FaPlus className="mr-2" /> Add New</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleUpload}
            className="bg-gray-800 p-4 rounded-lg shadow-lg grid grid-cols-2 gap-4"
          >
            <input name="title" type="text" placeholder="Title" value={formData.title} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white" required />
            <select name="category" value={formData.category} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white" required>
              <option value="notes">Notes</option>
              <option value="code">Code</option>
              <option value="videos">Lecture Videos</option>
              <option value="textbooks">Text Books</option>
            </select>
            <input name="sourceLink" type="text" placeholder="Source Link" value={formData.sourceLink} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white" required />
            <input name="instructor" type="text" placeholder="Instructor" value={formData.instructor} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white" required />
            <input name="date" type="date" value={formData.date} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white" required />
            <input name="courseCode" type="text" placeholder="Course Code" value={formData.courseCode} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white" required />
            <input name="batch" type="text" placeholder="Batch" value={formData.batch} onChange={handleChange} className="p-2 rounded-md bg-gray-700 text-white" required />
            <button type="submit" disabled={isUploading} className="col-span-2 p-2 bg-blue-600 text-white rounded-md">
              {isUploading ? "Processing..." : editId ? "Update Resource" : "Upload Resource"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(categorizedResources).map(([category, items]) => (
          <div key={category} className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-3 flex items-center">
              {category === "notes" && <FaStickyNote className="mr-2 text-yellow-400" />}
              {category === "code" && <FaCode className="mr-2 text-green-400" />}
              {category === "videos" && <FaVideo className="mr-2 text-red-400" />}
              {category === "textbooks" && <FaBook className="mr-2 text-blue-400" />}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h2>
            {items.length === 0 ? <p className="text-gray-500">No resources available</p> : (
              items.map((resource) => (
                <div key={resource.id} className="p-3 bg-gray-800 rounded-lg shadow-md mb-2">
                  <h3 className="font-semibold">{resource.title}</h3>
                  <p className="text-gray-400 text-sm">Instructor: {resource.instructor}</p>
                  <p className="text-gray-400 text-sm">Batch: {resource.batch}</p>
                  <p className="text-gray-400 text-sm">Course Code: {resource.courseCode}</p>
                  <p className="text-gray-400 text-sm">Date: {resource.date}</p>

                  <div className="flex justify-between mt-2">
                    <a href={resource.sourceLink} target="_blank" className="text-blue-400 underline">View</a>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(resource)} className="text-yellow-400"><FaEdit /></button>
                      <button onClick={() => handleDelete(resource.id)} className="text-red-400"><FaTrash /></button>
                    </div>
                  </div>
                  
                  
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminPage;

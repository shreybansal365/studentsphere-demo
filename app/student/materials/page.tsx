"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { FaBook, FaCode, FaVideo, FaStickyNote } from "react-icons/fa";
import { motion } from "framer-motion";

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

const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [batchFilter, setBatchFilter] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const db = getFirestore(app);
  const resourcesRef = collection(db, "resources");

  useEffect(() => {
    const unsubscribe = onSnapshot(resourcesRef, (snapshot) => {
      setResources(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resource)));
    });
    return () => unsubscribe();
  }, []);

  const filteredResources = resources.filter((res) => {
    return (
      (batchFilter ? res.batch === batchFilter : true) &&
      (courseFilter ? res.courseCode?.toLowerCase().includes(courseFilter.toLowerCase()) : true) &&
      (categoryFilter ? res.category === categoryFilter : true)
    );
  });
  

  const categorizedResources = {
    notes: filteredResources.filter((res) => res.category === "notes"),
    code: filteredResources.filter((res) => res.category === "code"),
    videos: filteredResources.filter((res) => res.category === "videos"),
    textbooks: filteredResources.filter((res) => res.category === "textbooks"),
  };

  return (
    <section className="p-6 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">Resources</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by Course Code"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="p-2 bg-gray-800 text-white rounded-md"
        />
        <input
          type="text"
          placeholder="Filter by Batch"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="p-2 bg-gray-800 text-white rounded-md"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2 bg-gray-800 text-white rounded-md"
        >
          <option value="">All Categories</option>
          <option value="notes">Notes</option>
          <option value="code">Code</option>
          <option value="videos">Videos</option>
          <option value="textbooks">Textbooks</option>
        </select>
      </div>

      {/* Categorized Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(categorizedResources).map(([category, items]) => (
          <div key={category} className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-3 flex items-center">
              {category === "notes" && <FaStickyNote className="mr-2 text-yellow-400" />}
              {category === "code" && <FaCode className="mr-2 text-green-400" />}
              {category === "videos" && <FaVideo className="mr-2 text-red-400" />}
              {category === "textbooks" && <FaBook className="mr-2 text-blue-400" />}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h2>
            {items.length === 0 ? (
              <p className="text-gray-500">No resources available</p>
            ) : (
              items.map((resource) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-gray-800 rounded-lg shadow-md mb-2"
                >
                  <h3 className="font-semibold">{resource.title}</h3>
                  <p className="text-sm text-gray-400">Instructor: {resource.instructor}</p>
                  <p className="text-sm text-gray-400">Date: {resource.date}</p>
                  <p className="text-sm text-gray-400">Course: {resource.courseCode}</p>
                  <p className="text-sm text-gray-400">Batch: {resource.batch}</p>

                  

                  <a href={resource.sourceLink} target="_blank" className="text-blue-400 underline">
                    View Resource
                  </a>


                </motion.div>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ResourcesPage;

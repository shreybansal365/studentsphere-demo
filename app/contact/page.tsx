"use client"
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaInstagram } from "react-icons/fa";
import Navbar from "../components/Navbar";

interface Contact {
  name: string;
  email?: string;
  instagram?: string;
  link?: string;
}

const contacts: Record<string, Contact[]> = {
  clubs: [
    { name: "Student Council", email: "student.council@muj.manipal.edu" },
    { name: "Coding Society", email: "coding@muj.manipal.edu" },
    { name: "Robotics Club", email: "robotics@muj.manipal.edu" },
    { name: "Debate Society", email: "debate@muj.manipal.edu" },
    { name: "Cultural Committee", email: "cultural@muj.manipal.edu" },
    { name: "Sports Council", email: "sports@muj.manipal.edu" },
  ],
  admin: [
    { name: "Director's Office", email: "director@muj.manipal.edu" },
    { name: "Registrar", email: "registrar@muj.manipal.edu" },
    { name: "Chief Warden", email: "warden@muj.manipal.edu" },
  ],
  support: [
    { name: "IT Helpdesk", email: "it.support@muj.manipal.edu" },
    { name: "Student Welfare", email: "welfare@muj.manipal.edu" },
    { name: "Campus Security", email: "security@muj.manipal.edu" },
  ],
};

const tabs = [
  { name: "Clubs & Organizations", id: "clubs" },
  { name: "Administration", id: "admin" },
  { name: "Support & Assistance", id: "support" },
];

const ContactPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("clubs");

  return (
    <div>
      <Navbar />
      {/* 
      <div className="relative min-h-screen bg-black flex flex-col text-white p-6">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-4xl font-extrabold text-[#0096FF] text-center mb-8">Contact Us</h1>
          <div className="flex justify-center space-x-4 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 rounded-md text-sm md:text-base transition-all duration-300 ${
                  activeTab === tab.id ? "bg-[#0096FF] text-black" : "bg-gray-700 hover:bg-gray-600"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            {contacts[activeTab]?.map((contact: Contact, index) => (
              <div key={index} className="mb-4 flex justify-between items-center border-b border-gray-600 pb-3">
                <p className="text-lg font-semibold">{contact.name}</p>
                <div className="flex space-x-3">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-[#0096FF] hover:underline flex items-center">
                      <FaEnvelope className="mr-2" /> Email
                    </a>
                  )}
                  {contact.instagram && (
                    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline flex items-center">
                      <FaInstagram className="mr-2" /> Instagram
                    </a>
                  )}
                  {contact.link && (
                    <a href={contact.link} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                      Visit
                    </a>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      */}
    </div>
  );
};

export default ContactPage;

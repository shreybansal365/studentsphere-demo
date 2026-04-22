"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

const AboutPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <Navbar />
      {/* 
      <div className="max-w-3xl text-center px-6 mt-16">
        <h1
          className={`text-4xl md:text-6xl font-extrabold text-[#0096FF] transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
          }`}
        >
          About StudentSphere
        </h1>
        <div className="w-20 h-1 bg-[#0096FF] mx-auto mt-4 rounded-full"></div>

        <p
          className={`mt-8 text-lg md:text-xl text-gray-300 leading-relaxed transition-all duration-1000 ease-out delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          StudentSphere is a centralized student portal designed to streamline and enhance student life. It integrates academic tools, event management, announcements, and personalization features into a single platform, ensuring students have everything they need at their fingertips.
        </p>

        <p
          className={`mt-6 text-lg md:text-xl text-gray-300 leading-relaxed transition-all duration-1000 ease-out delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          From batch-specific announcements and event RSVPs to an AI-powered chatbot and gamification features, StudentSphere empowers students to stay organized, engaged, and informed. With a user-friendly interface, dark/light mode support, and seamless integration with university systems, it redefines how students interact with their academic environment.
        </p>

        <a
          href="/sign-in"
          className={`inline-block mt-10 px-6 py-3 rounded-lg text-lg font-medium transition-all duration-500 ease-out ${
            isVisible
              ? "bg-[#0096FF] text-black hover:bg-[#0078CC] hover:scale-105 opacity-100"
              : "opacity-0 translate-y-6"
          }`}
        >
          Explore →
        </a>
      </div>
      */}
    </div>
  );
};

export default AboutPage;

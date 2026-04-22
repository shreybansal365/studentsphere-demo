/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Landing Page (Home)
 * This entire application was built from zero by: Shrey Bansal
 * No templates, no boilerplate — pure ground-up engineering.
 * shreybansal365@gmail.com | GitHub: @shreybansal365
 * Manipal University Jaipur — CSE 2026
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";
import React from 'react'
import Hero from './components/Hero'
import Navbar from './components/Navbar';
import Features from './components/Features';

const Home = () => {
  return (
    <div className="bg-transparent min-h-screen">
      <Navbar/>
      <Hero/> 
      <Features />
    </div>
  )
}

export default Home;

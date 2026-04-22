/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Navigation Bar Component
 * Architecture & responsive design by: Shrey Bansal
 * shreybansal365@gmail.com | GitHub: @shreybansal365
 * ═══════════════════════════════════════════════════════════════════
 */
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Image from 'next/image'; // Import the Next.js Image component
import Link from 'next/link';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems: { name: string; path: string }[] = [
    // { name: 'Home', path: '/' },
    // { name: 'Team', path: '/members' },
    // { name: 'About', path: '/about' },
    // { name: 'Contact', path: '/contact' },
    // { name: 'Feedback', path: '/feedback' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <header className="w-full bg-black py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Hamburger Icon for Small Devices */}
        <button
          className="md:hidden text-white text-xl focus:outline-none"
          onClick={toggleMenu}
        >
          ☰
        </button>

        <div className="lg:hidden md:hidden flex-grow flex justify-center items-center">
  <Link href="/">
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer bg-blue-900 border border-blue-500 rounded-lg px-4 py-2 shadow-lg"
    >
      <h1 className="text-xl font-bold text-white tracking-widest uppercase">Student<span className="text-blue-400">Sphere</span></h1>
    </motion.div>
  </Link>
</div>
        {/* Invisible spacer for right alignment */}
        <div className="w-6 md:hidden"></div>
      </div>

      {/* Navigation for Medium and Large Devices */}
      {/* 
      <nav className="hidden md:flex gap-4 items-center justify-center mt-4 p-2 border border-[#0096FF] rounded-full bg-transparent mx-auto w-fit">

        {navItems.map((item, index) => (
          <motion.a
            key={index}
            href={item.path}
            className={`text-lg font-semibold px-4 py-2 rounded-full hover:bg-[#0096FF] hover:text-black transition-all duration-300 ${
              pathname === item.path ? 'bg-[#0096FF] text-black' : 'text-white'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {item.name}
          </motion.a>
        ))}
      </nav>
      */}

      {/* Side Drawer for Small Devices */}
      <motion.div
        className={`fixed top-0 right-0 h-full w-64 bg-black shadow-lg transform ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 z-50`}
        initial={{ x: '100%' }}
        animate={{ x: isMenuOpen ? 0 : '100%' }}
        exit={{ x: '100%' }}
      >
        <div className="p-4">
          <button
            className="text-white text-2xl focus:outline-none"
            onClick={toggleMenu}
          >
            ×
          </button>
        </div>
        <nav className="flex flex-col gap-4 p-6">
          {navItems.map((item, index) => (
            <motion.a
              key={index}
              href={item.path}
              className={`text-white text-lg font-semibold px-4 py-2 rounded hover:bg-[#0096FF] transition-colors duration-300 ${
                pathname === item.path ? 'bg-[#0096FF] text-black' : ''
              }`}
              onClick={toggleMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.name}
            </motion.a>
          ))}
        </nav>
      </motion.div>
    </header>
  );
};

export default Navbar;
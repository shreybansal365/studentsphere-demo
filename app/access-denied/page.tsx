// app/access-denied/page.tsx
"use client"
import React from 'react';
import { useRouter } from 'next/navigation'; // Change this import

const AccessDenied = () => {
  const router = useRouter();

  const goToRolePage = () => {
    router.push('/sign-in'); // Or you could push to a page based on user role
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-2xl font-semibold mb-6">Access Denied</h2>
        <p className="mb-4">You do not have permission to view this page.</p>
        <button
          onClick={goToRolePage}
          className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;

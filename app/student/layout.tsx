"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
 // Ensure correct Firebase import
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import Stnav from "../components/Stnav";
 // Student Navbar

interface LayoutProps {
  children: ReactNode;
}

const StudentLayout: React.FC<LayoutProps> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userRole = userDoc.data().role;
          setRole(userRole);

          // Redirect if user is not a student
          if (userRole !== "student") {
            router.push("/access-denied");
          }
        } else {
          console.error("User document not found");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <Stnav />
      {children}
    </div>
  );
};

export default StudentLayout;

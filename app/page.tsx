"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  // 🛡️ Route Protection: Check if user is logged in on mount
  useEffect(() => {
    const auth = localStorage.getItem("isLoggedIn");
    if (!auth) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative">
      
      {/* 🔓 Logout Button */}
      <button 
        onClick={handleLogout}
        className="absolute top-8 right-8 text-slate-400 hover:text-red-500 font-bold text-sm transition-colors flex items-center gap-2"
      >
        Logout 🚪
      </button>

      {/* CareerFirst AI Main Card */}
      <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/60 max-w-4xl w-full">
        <h1 className="text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">
          CareerFirst <span className="text-blue-600">AI</span> 🚀
        </h1>
        
        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
          The all-in-one platform to master your interview skills, 
          perfect your resume, and find your dream role.
        </p>

        {/* 🛠️ Updated Grid for 4 Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          
          {/* 1. ATS Scanner */}
          <Link 
            href="/ats" 
            className="flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            📄 ATS Scanner
          </Link>

          {/* 2. Interview Simulator */}
          <Link 
            href="/interview" 
            className="flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 py-5 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
          >
            🤵 Interview Sim
          </Link>

          {/* 3. Search Jobs */}
          <Link 
            href="/jobs" 
            className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            🔍 Search Jobs
          </Link>

          {/* 4. LinkedIn Pro Optimizer */}
          <Link 
            href="/linkedin" 
            className="flex items-center justify-center gap-3 bg-sky-500 text-white px-6 py-5 rounded-2xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 active:scale-95"
          >
            🟦 LinkedIn Pro
          </Link>

        </div>

        <p className="mt-12 text-slate-400 text-sm font-medium">
          Professional AI Coaching • Live Job Search • LinkedIn Optimization
        </p>
      </div>
    </div>
  );
}
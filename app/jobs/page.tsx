"use client";

import { useState } from "react";
import Link from "next/link";

export default function JobSearchPage() {
  const [role, setRole] = useState("");
  const [exp, setExp] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/search-jobs", {
        method: "POST",
        body: JSON.stringify({ role, experience: exp }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      setJobs(data.jobs || []);
    } catch (err) {
      alert("Search failed. Check your RapidAPI key in .env.local");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-10 flex flex-col items-center bg-slate-50/50">
      {/* Header Section */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Find Your Next Role 🔍</h1>
          <p className="text-slate-500 mt-1">Discover opportunities from LinkedIn, Unstop, and more.</p>
        </div>
        <Link href="/" className="bg-white border border-slate-200 px-5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
          ← Back
        </Link>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 w-full max-w-5xl flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[280px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Job Role</label>
          <input 
            type="text" 
            placeholder="e.g. Frontend Developer" 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-slate-800 font-medium"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Experience</label>
          <input 
            type="number" 
            placeholder="Years" 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-slate-800 font-medium"
            value={exp}
            onChange={(e) => setExp(e.target.value)}
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading || !role}
          className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          {loading ? "Searching..." : "Search Jobs"}
        </button>
      </div>

      {/* Results List */}
      <div className="w-full max-w-5xl mt-12 space-y-4">
        {jobs.length === 0 && !loading && (
          <div className="text-center py-24 bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium text-lg">Search a role to start your journey.</p>
          </div>
        )}
        
        {jobs.map((job: any, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:border-blue-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Left Section: Logo + Details */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner p-2">
                {job.employer_logo ? (
                  <img src={job.employer_logo} alt={job.employer_name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl font-black text-slate-300">{job.employer_name?.charAt(0)}</span>
                )}
              </div>
              
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-4">
                  {job.job_title}
                </h3>
                <p className="text-slate-500 text-sm font-medium truncate">
                  {job.employer_name} <span className="text-slate-300 mx-1">•</span> {job.job_city || "Remote"}
                </p>
                <div className="flex gap-2 mt-2.5">
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-100">
                    Interview Ready
                  </span>
                  <span className="text-[9px] bg-slate-50 text-slate-400 font-black px-2 py-1 rounded-md uppercase tracking-widest border border-slate-100">
                    {job.job_employment_type || "Full Time"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right Section: FIXED Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
              <Link 
                href={`/interview?role=${encodeURIComponent(job.job_title)}&company=${encodeURIComponent(job.employer_name)}`}
                className="flex-1 md:flex-none whitespace-nowrap bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50 active:scale-95 text-center"
              >
                Practice Now 🤵
              </Link>

              <a 
                href={job.job_apply_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 md:flex-none whitespace-nowrap bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 active:scale-95 text-center"
              >
                Apply Now
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
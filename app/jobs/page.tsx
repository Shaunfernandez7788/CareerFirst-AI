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
    <div className="min-h-screen p-10 flex flex-col items-center">
      {/* Header Section */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Find Your Next Role 🔍</h1>
          <p className="text-slate-500 mt-1">Discover opportunities from LinkedIn, Unstop, and more.</p>
        </div>
        <Link href="/" className="bg-white border border-slate-200 px-5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
          ← Back to Home
        </Link>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 w-full max-w-4xl flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[280px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Job Role</label>
          <input 
            type="text" 
            placeholder="e.g. Frontend Developer" 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-slate-800 font-medium"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Experience</label>
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
          className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          {loading ? "Searching..." : "Search Jobs"}
        </button>
      </div>

      {/* Results List */}
      <div className="w-full max-w-4xl mt-12 grid gap-6">
        {jobs.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium text-lg">Enter a role above to explore live job listings.</p>
          </div>
        )}
        
        {jobs.map((job: any, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex flex-col md:flex-row justify-between items-center group animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6 w-full">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                {job.employer_logo ? (
                  <img src={job.employer_logo} alt={job.employer_name} className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-2xl font-black text-slate-200">{job.employer_name.charAt(0)}</span>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{job.job_title}</h3>
                <p className="text-slate-500 font-medium">{job.employer_name} • {job.job_city || "Remote"}</p>
                <div className="flex gap-2 mt-3">
                  <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    Interview Ready
                  </span>
                  <span className="inline-block text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    {job.job_employment_type || "Full Time"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 👇 UPDATED Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-6 md:mt-0">
              <Link 
                href={`/interview?role=${encodeURIComponent(job.job_title)}&company=${encodeURIComponent(job.employer_name)}`}
                className="flex-1 md:flex-none text-center bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95"
              >
                Practice Now 🤵
              </Link>

              <a 
                href={job.job_apply_link} 
                target="_blank" 
                className="flex-1 md:flex-none text-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95"
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
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LinkedInOptimizer() {
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    // 🛡️ Prevent empty submissions
    if (!headline || !role) return alert("Please fill in the Role and Headline!");

    setLoading(true);
    setResult(""); 

    try {
      const res = await fetch("/api/linkedin-optimize", {
        method: "POST",
        // 👇 CRITICAL: Tell the server you are sending JSON
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, bio, targetRole: role }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setResult(data.analysis);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format AI response (Bold keywords)
  const formatResult = (text: string) => {
    return text.split("\n").map((line, i) => (
      <p key={i} className="mb-2">
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
          part.startsWith("**") ? (
            <strong key={j} className="text-blue-700">{part.replace(/\*\*/g, "")}</strong>
          ) : part
        )}
      </p>
    ));
  };

  return (
    <div className="min-h-screen p-10 flex flex-col items-center bg-slate-50">
      <div className="w-full max-w-5xl flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">LinkedIn Optimizer 🟦</h1>
          <p className="text-slate-500 font-medium">Rank higher in Bengaluru recruiter searches.</p>
        </div>
        <Link href="/" className="bg-white border border-slate-200 px-6 py-2 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
          ← Back
        </Link>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col gap-6">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Target Job Role *</label>
          <input 
            type="text" 
            placeholder="e.g. Java Backend Developer"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-300 transition-all"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Current Headline *</label>
          <input 
            type="text" 
            placeholder="Student at CIT | Java Enthusiast..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-300 transition-all"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">About / Bio Section</label>
          <textarea 
            placeholder="Paste your 'About' section here..."
            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-300 transition-all resize-none"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <button 
          onClick={handleOptimize}
          disabled={loading || !headline || !role}
          className="bg-blue-600 text-white w-full py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Analyzing Your Brand...
            </span>
          ) : "Optimize My Profile 🚀"}
        </button>
      </div>

      {result && (
        <div className="w-full max-w-3xl mt-10 bg-white p-10 rounded-3xl border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <span className="text-3xl">🎯</span>
            <h2 className="text-2xl font-bold text-slate-800">Your AI Branding Strategy</h2>
          </div>
          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
            {formatResult(result)}
          </div>
        </div>
      )}
    </div>
  );
}
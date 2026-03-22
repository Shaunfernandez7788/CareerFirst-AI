"use client";

import { useState } from "react";
import Link from "next/link";

export default function ATSPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState("");

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleScan = async () => {
    if (!file || !jobDesc) {
      alert("Please upload resume and enter job description");
      return;
    }
    setLoading(true);
    try {
      const base64File = await fileToBase64(file);
      const res = await fetch("/api/ats-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData: base64File, jobDesc }),
      });
      const data = await res.json();
      setResult(data.analysis);
    } catch (err) {
      console.error(err);
      alert("Something went wrong with the scan");
    }
    setLoading(false);
  };

  const handleFixAndDownload = async () => {
    if (!file || !jobDesc) {
      alert("Please upload your resume and enter a job description first!");
      return;
    }

    setFixing(true);

    try {
      const base64File = await fileToBase64(file);

      const res = await fetch("/api/improve-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData: base64File, jobDesc }),
      });

      const data = await res.json();

      if (data.improvedResume) {
        const htmlContent = `
          <style>
            li, p, ul { page-break-inside: avoid; }
            h1, h2, h3, h4 { page-break-after: avoid; }
          </style>
          <div style="width: 100%; max-width: 800px; margin: 0 auto; font-family: Arial; padding: 20px;">
            ${data.improvedResume}
          </div>
        `;

        const html2pdfModule = await import("html2pdf.js");
        const html2pdf: any = html2pdfModule.default;

        await html2pdf()
          .set({
            margin: 10,
            filename: "ATS_Optimized_Resume.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(htmlContent)
          .save();
      } else {
        alert("Could not generate improved resume.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate optimized resume");
    }

    setFixing(false);
  };

  return (
    <div className="min-h-screen p-10 flex flex-col items-center bg-slate-50">
      {/* HEADER */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            ATS Resume Scanner 📄
          </h1>
          <p className="text-slate-500 mt-1 text-sm italic">
            Rank Higher. Get Hired.
          </p>
        </div>
        <Link
          href="/"
          className="bg-white border px-5 py-2 rounded-xl text-slate-600 font-bold"
        >
          ← Back
        </Link>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col gap-6">

        {/* FILE UPLOAD */}
        <div className="flex flex-col items-center border-2 border-dashed border-slate-300 rounded-2xl p-8 hover:border-blue-400 transition">
          <label className="cursor-pointer flex flex-col items-center">
            <span className="text-4xl mb-3">📤</span>
            <span className="text-slate-600 font-semibold text-lg">
              {file ? file.name : "Choose Resume (PDF)"}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* 🔥 UPDATED TEXTAREA */}
        <div className="relative">
          <textarea
            className="w-full h-48 p-5 bg-white border-2 border-dashed border-slate-300 rounded-2xl 
            focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
            outline-none text-slate-800 font-medium 
            placeholder:text-slate-400 placeholder:italic
            transition-all"
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />

          {!jobDesc && (
            <span className="absolute top-5 left-5 text-slate-300 italic pointer-events-none">
              Enter job description here...
            </span>
          )}
        </div>

        {/* BUTTON */}
        <button
          onClick={handleScan}
          disabled={loading || fixing}
          className="bg-blue-600 text-white w-full py-4 rounded-2xl font-bold hover:bg-blue-700 transition"
        >
          {loading ? "Analyzing..." : "Scan Resume"}
        </button>
      </div>

      {/* RESULT */}
      {result && (
        <div className="w-full max-w-3xl mt-10 bg-white p-8 rounded-3xl shadow-xl">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">Analysis Result</h2>
            <button
              onClick={handleFixAndDownload}
              disabled={fixing}
              className="bg-green-600 px-6 py-3 rounded-xl text-white font-bold hover:bg-green-700 transition"
            >
              {fixing ? "Generating..." : "Download PDF"}
            </button>
          </div>

          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Webcam from "react-webcam";

type Message = {
  type: "ai-question" | "user-answer" | "ai-feedback";
  content: string;
};

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState("");
  const [company, setCompany] = useState(""); 
  const [chat, setChat] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isStarted, setIsStarted] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  
  const webcamRef = useRef<Webcam>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const faceapiRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const urlRole = searchParams.get("role");
    const urlCompany = searchParams.get("company");
    if (urlRole) setRole(urlRole);
    if (urlCompany) setCompany(urlCompany);
  }, [searchParams]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi; 
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) {
        console.error("Models not found.", err);
      }
    };
    if (typeof window !== "undefined") loadModels();
    return () => stopProctoringHardware();
  }, []);

  const stopProctoringHardware = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const setupProctoringHardware = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream; 
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const microphone = audioCtx.createMediaStreamSource(stream);
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      microphone.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      return true; 
    } catch (err) {
      alert("Please allow Camera and Microphone access.");
      return false; 
    }
  };

  // Simplified Proctoring Loop
  useEffect(() => {
    if (!isStarted || !modelsLoaded || !faceapiRef.current) return;
    const faceapi = faceapiRef.current; 
    let consecutiveMisses = 0; 
    const interval = setInterval(async () => {
      let strike = false;
      let reason = "";
      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        if (video.readyState === 4 && video.videoWidth > 0) {
          try {
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.05 });
            const detections = await faceapi.detectAllFaces(video, options);
            if (detections.length === 0) {
              consecutiveMisses++;
              if (consecutiveMisses >= 3) { strike = true; reason = "No face detected!"; }
            } else {
              consecutiveMisses = 0; 
              if (detections.length > 1) { strike = true; reason = "Multiple people detected!"; }
            }
          } catch (err) {}
        }
      }
      if (strike) {
        setWarningMessage(reason);
        setTimeout(() => setWarningMessage(""), 3000);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isStarted, modelsLoaded]);

  const startInterview = async () => {
    if (!modelsLoaded) return;
    setLoading(true);
    if (!(await setupProctoringHardware())) return setLoading(false);
    setIsStarted(true);
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, previousQuestions: [] }), 
      });
      const data = await res.json();
      setChat([{ type: "ai-question", content: data.question }]);
    } catch (err: any) { alert(`Backend Error: ${err.message}`); setIsStarted(false); stopProctoringHardware(); }
    setLoading(false);
  };

  // 👇 FIXED: submitAnswer with robust feedback handling
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const userMsg = { type: "user-answer" as const, content: currentAnswer };
    const currentChatState = [...chat, userMsg];
    
    setChat(currentChatState); // Show user message immediately
    const tempAnswer = currentAnswer;
    setCurrentAnswer("");
    setLoading(true);

    try {
      // Find the last question asked by the AI
      const lastQ = [...chat].reverse().find(m => m.type === "ai-question")?.content;

      // 1. Get Feedback from API
      const resFeed = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, question: lastQ, answer: tempAnswer }), 
      });
      
      const dataFeed = await resFeed.json();
      const feedbackMsg = { 
        type: "ai-feedback" as const, 
        content: dataFeed.feedback || "AI was unable to generate specific feedback for this answer." 
      };

      // Update state with feedback
      const chatAfterFeedback = [...currentChatState, feedbackMsg];
      setChat(chatAfterFeedback);

      // 2. Get Next Question
      const previousQs = chatAfterFeedback.filter(m => m.type === "ai-question").map(m => m.content);
      const resNextQ = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, previousQuestions: previousQs }), 
      });
      
      const dataNextQ = await resNextQ.json();
      if (dataNextQ.question) {
        setChat([...chatAfterFeedback, { type: "ai-question" as const, content: dataNextQ.question }]);
      }

    } catch (err: any) { 
      alert("Error processing your answer. Please try again."); 
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = () => {
    setIsStarted(false);
    setChat([]);
    setRole("");
    setCompany("");
    stopProctoringHardware();
  };

  return (
    <div className="min-h-screen p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">CareerFirst AI: Interview Room 🧑‍💼</h1>
        {isStarted && (
          <div className="flex gap-4 items-center">
            <button onClick={handleEndInterview} className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg active:scale-95">🛑 End Interview</button>
            <div className="w-32 h-24 bg-slate-200 rounded-xl overflow-hidden border-2 border-slate-300 relative">
              <Webcam ref={webcamRef} audio={false} className="w-full h-full object-cover" mirrored={true} />
              <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm text-white text-[10px] font-bold">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> REC
              </div>
            </div>
          </div>
        )}
      </div>

      {!isStarted ? (
        <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Target Job Role *</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-4 bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 mt-2 outline-none font-medium" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Target Company</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full p-4 bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 mt-2 outline-none font-medium" />
            </div>
            <button onClick={startInterview} disabled={loading || !modelsLoaded || !role.trim()} className="bg-blue-600 text-white w-full py-4 rounded-2xl font-bold transition shadow-lg active:scale-95">
              {!modelsLoaded ? "Loading AI Models..." : "Start Interview 🚀"}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 min-h-[450px] max-h-[550px] overflow-y-auto flex flex-col gap-5 shadow-2xl">
            {chat.map((msg, i) => (
              <div key={i} className={`p-5 rounded-2xl max-w-[85%] shadow-sm ${msg.type === "user-answer" ? "bg-blue-600 text-white self-end text-right rounded-tr-none" : msg.type === "ai-feedback" ? "bg-slate-50 self-start border-l-4 border-amber-400 text-slate-800 rounded-tl-none" : "bg-slate-50 self-start border-l-4 border-emerald-500 text-slate-800 rounded-tl-none"}`}>
                <span className={`text-[10px] block mb-2 uppercase tracking-widest font-bold ${msg.type === "user-answer" ? "text-blue-200" : "text-slate-400"}`}>{msg.type === "ai-question" ? "Interviewer" : msg.type === "ai-feedback" ? "Feedback" : "You"}</span>
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</div>
              </div>
            ))}
            {loading && <p className="text-slate-400 italic text-sm animate-pulse ml-2 font-medium">AI is thinking...</p>}
          </div>
          <div className="flex flex-col gap-4">
            <textarea placeholder="Type your answer here..." value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} disabled={loading} className="w-full h-28 p-5 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-lg outline-none font-medium" />
            <div className="flex justify-end">
                <button onClick={submitAnswer} disabled={loading || !currentAnswer.trim()} className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-bold shadow-lg active:scale-95">Submit Answer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";

type Message = {
  type: "ai-question" | "user-answer" | "ai-feedback";
  content: string;
};

export default function InterviewContent() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warning, setWarning] = useState("");
  const [score, setScore] = useState(0);

  const webcamRef = useRef<Webcam>(null);
  const faceapiRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat, loading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = false; 
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        let newTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) newTranscript += event.results[i][0].transcript;
        }
        if (newTranscript) {
          setCurrentAnswer(prev => prev.trim() ? `${prev.trim()} ${newTranscript.trim()}` : newTranscript.trim());
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    try {
      if (isListening) recognitionRef.current?.stop();
      else { recognitionRef.current?.start(); setIsListening(true); }
    } catch (err) { setIsListening(false); }
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) { console.error(err); }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!isStarted || !modelsLoaded) return;
    const interval = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;
      const detections = await faceapiRef.current.detectAllFaces(video, new faceapiRef.current.TinyFaceDetectorOptions());
      setWarning(detections.length === 0 ? "FACE NOT VISIBLE!" : "");
    }, 2000);
    return () => clearInterval(interval);
  }, [isStarted, modelsLoaded]);

  const startInterview = async () => {
    if (!role.trim()) return alert("Please enter a role");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, previousQuestions: [] }),
      });
      const data = await res.json();
      if (data.question) {
        setChat([{ type: "ai-question", content: data.question }]);
        setIsStarted(true);
      }
    } catch (err) { alert("System error. Check connection."); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim() || loading) return;
    const userMsg = { type: "user-answer" as const, content: currentAnswer };
    const history = [...chat, userMsg];
    setChat(history);
    setCurrentAnswer("");
    setLoading(true);
    if (isListening) toggleListening();

    try {
      const lastQ = chat.filter(m => m.type === "ai-question").pop()?.content;
      const resFeed = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, question: lastQ, answer: userMsg.content }),
      });
      const dataFeed = await resFeed.json();
      setScore(prev => prev + (dataFeed.score || 0));

      const chatWithFeed = [...history, { type: "ai-feedback" as const, content: dataFeed.feedback }];
      setChat(chatWithFeed);

      const resNext = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          role, 
          company, 
          previousQuestions: chatWithFeed.filter(m => m.type === "ai-question").map(m => m.content) 
        }),
      });
      const dataNext = await resNext.json();
      if (dataNext.question) setChat([...chatWithFeed, { type: "ai-question", content: dataNext.question }]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // --- CENTERED FINISH VIEW ---
  if (isFinished) {
    return (
      <div className="w-full flex items-center justify-center min-h-[70vh] px-4">
        <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl border border-slate-100 text-center w-full max-w-xl animate-in zoom-in-95 duration-500">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Session Ended</h2>
          <p className="text-slate-500 font-medium mb-10 italic">Great job practicing for the {role} position!</p>
          <div className="bg-blue-50 rounded-[2.5rem] p-10 mb-10 shadow-inner">
            <div className="text-8xl font-black text-blue-600 mb-1 leading-none">{score}</div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mt-4">Total Rating</div>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-10">
        <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">Interview Pro 🚀</h1>
        <div className="flex gap-4 justify-center">
          <div className="bg-white border border-slate-200 text-blue-600 px-8 py-2.5 rounded-2xl text-sm font-bold shadow-sm">SCORE: {score}</div>
          {isStarted && <button onClick={() => setIsFinished(true)} className="bg-red-50 text-red-600 px-8 py-2.5 rounded-2xl text-sm font-bold hover:bg-red-100 transition-all">LEAVE SESSION</button>}
        </div>
      </div>

      {!isStarted ? (
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <input placeholder="Job Role (e.g. Java Developer)" value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-semibold text-slate-900" />
          <input placeholder="Company (e.g. Google)" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-semibold text-slate-900" />
          <button onClick={startInterview} disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 shadow-xl shadow-blue-100 disabled:bg-slate-200 transition-all">
            {loading ? "Connecting..." : "Begin Interview"}
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl animate-in fade-in duration-500">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
              <Webcam ref={webcamRef} className="rounded-2xl w-full grayscale-[20%]" mirrored={true} />
              {warning && <div className="absolute inset-x-0 bottom-0 bg-red-600 text-white text-[10px] font-bold py-2 text-center animate-pulse uppercase tracking-widest">{warning}</div>}
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.min((chat.length / 8) * 100, 100)}%` }}></div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Progress Tracker</p>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div ref={chatContainerRef} className="bg-white p-8 h-[500px] overflow-y-auto rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 scroll-smooth">
              {chat.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.type === "user-answer" ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] font-black text-slate-300 uppercase mb-2 px-1">{msg.type === "ai-question" ? "Interviewer" : msg.type === "ai-feedback" ? "Insight" : "You"}</span>
                  <div className={`p-5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${msg.type === "user-answer" ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-50" : msg.type === "ai-feedback" ? "bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tl-none italic" : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none shadow-inner"}`}>{msg.content}</div>
                </div>
              ))}
              {loading && <div className="flex gap-2 p-5 bg-slate-50 rounded-2xl w-fit animate-pulse"><div className="w-2 h-2 bg-blue-400 rounded-full"></div><div className="w-2 h-2 bg-blue-400 rounded-full delay-75"></div><div className="w-2 h-2 bg-blue-400 rounded-full delay-150"></div></div>}
            </div>

            <div className="relative">
              <textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder="Type or speak your answer..." className="w-full p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl focus:ring-4 focus:ring-blue-50 outline-none text-slate-900 min-h-[160px] transition-all pr-44 text-sm" />
              <div className="absolute right-6 bottom-6 flex gap-3">
                <button type="button" onClick={toggleListening} className={`p-4 rounded-2xl transition-all shadow-sm ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>{isListening ? "Stop" : "Speak"}</button>
                <button type="button" onClick={submitAnswer} disabled={!currentAnswer.trim() || loading} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 disabled:bg-slate-200 transition-all text-sm">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
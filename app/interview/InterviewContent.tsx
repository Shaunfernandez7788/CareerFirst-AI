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
  const [isFinished, setIsFinished] = useState(false); // Track completion
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
  }, [chat]);

  // 🎤 SPEECH RECOGNITION
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

  // 📷 FACE MODEL
  useEffect(() => {
    const load = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) {}
    };
    load();
  }, []);

  // 👀 FACE DETECTION
  useEffect(() => {
    if (!isStarted || !modelsLoaded) return;
    let miss = 0;
    const interval = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;
      const detections = await faceapiRef.current.detectAllFaces(video, new faceapiRef.current.TinyFaceDetectorOptions());
      if (detections.length === 0) {
        miss++;
        if (miss >= 3) setWarning("Face not visible!");
      } else {
        setWarning("");
        miss = 0;
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isStarted, modelsLoaded]);

  // 🚀 INTERVIEW LOGIC
  const startInterview = async () => {
    if (!role.trim()) return alert("Please enter a role");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        body: JSON.stringify({ role, company, previousQuestions: [] }),
      });
      const data = await res.json();
      setChat([{ type: "ai-question", content: data.question }]);
      setIsStarted(true);
    } catch (err) { alert("Failed to start session"); }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim() || loading) return;
    const userMsg = { type: "user-answer" as const, content: currentAnswer };
    const lastAnswer = currentAnswer;
    setCurrentAnswer("");
    setLoading(true);
    if (isListening) toggleListening();

    try {
      const lastQ = [...chat].reverse().find(m => m.type === "ai-question")?.content;
      
      // 1. Evaluate
      const resFeed = await fetch("/api/evaluate-answer", {
        method: "POST",
        body: JSON.stringify({ role, company, question: lastQ, answer: lastAnswer }),
      });
      const dataFeed = await resFeed.json();
      setScore(prev => prev + (dataFeed.score || 0));

      const updatedChat = [...chat, userMsg, { type: "ai-feedback" as const, content: dataFeed.feedback }];
      
      // 2. Next Question
      const prevQs = updatedChat.filter(m => m.type === "ai-question").map(m => m.content);
      const resNext = await fetch("/api/generate-question", {
        method: "POST",
        body: JSON.stringify({ role, company, previousQuestions: prevQs }),
      });
      const dataNext = await resNext.json();

      setChat([...updatedChat, { type: "ai-question", content: dataNext.question }]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // --- RENDERING ---

  if (isFinished) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-white p-16 rounded-[3rem] shadow-2xl border border-slate-100 text-center max-w-xl animate-in zoom-in-95 duration-500">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">Session Ended</h2>
          <p className="text-slate-500 font-medium mb-10">Great job practicing for the {role} role!</p>
          <div className="bg-blue-50 rounded-3xl p-8 mb-10">
            <div className="text-6xl font-black text-blue-600 mb-1">{score}</div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Total Rating</div>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-10">
        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight mb-4 drop-shadow-sm">
          Interview Pro <span className="text-blue-600">🚀</span>
        </h1>
        <div className="flex gap-4 justify-center">
          <div className="bg-white border border-slate-200 text-blue-600 px-8 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-sm">
            Live Score: {score}
          </div>
          {isStarted && (
            <button 
              onClick={() => setIsFinished(true)}
              className="bg-red-50 border border-red-100 text-red-600 px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-red-100 transition-all"
            >
              Leave Session
            </button>
          )}
        </div>
      </div>

      {!isStarted ? (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 ml-2 tracking-widest">Target Job Role</label>
            <input
              placeholder="e.g. Java Developer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 ml-2 tracking-widest">Company Name</label>
            <input
              placeholder="e.g. AeroAegis"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-900 font-semibold"
            />
          </div>
          <button
            onClick={startInterview}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:bg-slate-300"
          >
            {loading ? "Preparing Session..." : "Begin Interview"}
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
              <Webcam ref={webcamRef} className="rounded-2xl w-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" mirrored={true} />
              {warning && (
                <div className="absolute inset-x-0 bottom-0 bg-red-600/90 backdrop-blur-md text-white text-[11px] font-bold py-2.5 text-center animate-pulse tracking-wide uppercase">
                  ⚠️ {warning}
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 text-center">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min((chat.length / 10) * 100, 100)}%` }}></div>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Progress Tracker</p>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div ref={chatContainerRef} className="bg-white p-8 h-[500px] overflow-y-auto rounded-3xl shadow-xl border border-slate-100 space-y-6 scroll-smooth">
              {chat.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.type === "user-answer" ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1">
                    {msg.type === "ai-question" ? "Interviewer" : msg.type === "ai-feedback" ? "Real-time Insight" : "You"}
                  </span>
                  <div className={`p-5 rounded-2xl max-w-[85%] text-[13.5px] leading-relaxed shadow-sm ${
                    msg.type === "user-answer" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : msg.type === "ai-feedback" 
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tl-none font-medium italic"
                      : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-blue-500 text-[11px] animate-pulse font-bold tracking-widest uppercase ml-1">Evaluating Performance...</div>}
            </div>

            <div className="relative">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your response here..."
                className="w-full p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl focus:ring-4 focus:ring-blue-50 outline-none text-slate-900 min-h-[160px] transition-all pr-44 text-sm leading-relaxed"
              />
              <div className="absolute right-6 bottom-6 flex gap-4">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-4 rounded-2xl transition-all shadow-md ${isListening ? "bg-red-500 animate-pulse text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                >
                  {isListening ? "⏹ Stop" : "🎤 Speak"}
                </button>
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || loading}
                  className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 disabled:bg-slate-200 transition-all text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
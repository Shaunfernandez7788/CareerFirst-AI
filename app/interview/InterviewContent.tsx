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

  // 🎤 FIXED SPEECH RECOGNITION (No Duplication)
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
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript;
          }
        }
        
        if (newTranscript) {
          setCurrentAnswer(prev => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${newTranscript.trim()}` : newTranscript.trim();
          });
        }
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    try {
      if (isListening) {
        recognitionRef.current?.stop();
      } else {
        recognitionRef.current?.start();
        setIsListening(true);
      }
    } catch (err) {
      setIsListening(false);
    }
  };

  // 📷 LOAD FACE MODEL
  useEffect(() => {
    const load = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) {
        console.error("Face API load error:", err);
      }
    };
    load();
  }, []);

  // 👀 FACE DETECTION LOOP
  useEffect(() => {
    if (!isStarted || !modelsLoaded) return;
    let miss = 0;
    const interval = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;

      const detections = await faceapiRef.current.detectAllFaces(
        video,
        new faceapiRef.current.TinyFaceDetectorOptions()
      );

      if (detections.length === 0) {
        miss++;
        if (miss >= 3) setWarning("Face not visible!");
      } else if (detections.length > 1) {
        setWarning("Multiple people detected!");
        miss = 0;
      } else {
        setWarning("");
        miss = 0;
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isStarted, modelsLoaded]);

  const startInterview = async () => {
    if (!role.trim()) return alert("Enter role");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        body: JSON.stringify({ role, company, previousQuestions: [] }),
      });
      const data = await res.json();
      setChat([{ type: "ai-question", content: data.question }]);
      setIsStarted(true);
    } catch (err) {
      alert("Error starting interview");
    }
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
      const resFeed = await fetch("/api/evaluate-answer", {
        method: "POST",
        body: JSON.stringify({ role, company, question: lastQ, answer: lastAnswer }),
      });
      const dataFeed = await resFeed.json();
      setScore(prev => prev + (dataFeed.score || 0));

      const chatWithFeedback = [...chat, userMsg, { type: "ai-feedback" as const, content: dataFeed.feedback || "Good effort." }];
      setChat(chatWithFeedback);

      const resNext = await fetch("/api/generate-question", {
        method: "POST",
        body: JSON.stringify({ 
          role, 
          company, 
          previousQuestions: chatWithFeedback.filter(m => m.type === "ai-question").map(m => m.content) 
        }),
      });
      const dataNext = await resNext.json();
      if (dataNext.question) {
        setChat([...chatWithFeedback, { type: "ai-question", content: dataNext.question }]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    // FIXED: Main container now ensures full width and vertical centering
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh]">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-10">
        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight mb-4 drop-shadow-sm">
          Interview Pro <span className="text-blue-600">🚀</span>
        </h1>
        <div className="inline-block bg-white border border-slate-200 text-blue-600 px-8 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-sm">
          Live Score: {score}
        </div>
      </div>

      {!isStarted ? (
        // CARD IS NOW CENTERED
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 ml-2 tracking-widest">Target Job Role</label>
            <input
              placeholder="e.g. Java Developer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 ml-2 tracking-widest">Company (Optional)</label>
            <input
              placeholder="e.g. MindMatrix"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 font-semibold"
            />
          </div>
          <button
            onClick={startInterview}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:bg-slate-300"
          >
            {loading ? "Initializing..." : "Start Interview Session"}
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
          
          {/* MONITORING BAR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
              <Webcam ref={webcamRef} className="rounded-2xl w-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" mirrored={true} />
              {warning && (
                <div className="absolute inset-x-0 bottom-0 bg-red-600/90 backdrop-blur-md text-white text-[11px] font-bold py-2.5 text-center animate-pulse tracking-wide">
                  ⚠️ {warning}
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase mb-4 tracking-widest">Session Progress</h3>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min((chat.length / 10) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* CHAT BOX & INPUT */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div 
              ref={chatContainerRef}
              className="bg-white p-8 h-[480px] overflow-y-auto rounded-3xl shadow-xl border border-slate-100 space-y-6 scroll-smooth"
            >
              {chat.length === 0 && <p className="text-slate-400 italic text-center mt-24">Preparing your tailored interview questions...</p>}
              {chat.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.type === "user-answer" ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1">
                    {msg.type === "ai-question" ? "Interviewer" : msg.type === "ai-feedback" ? "Real-time Insight" : "Your Answer"}
                  </span>
                  <div className={`p-5 rounded-2xl max-w-[85%] text-[13.5px] leading-relaxed shadow-sm transition-all ${
                    msg.type === "user-answer" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : msg.type === "ai-feedback" 
                      ? "bg-amber-50 text-amber-900 border border-amber-100 rounded-tl-none font-medium"
                      : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-blue-500 text-[11px] animate-pulse font-bold tracking-widest uppercase ml-1">Analyzing Response...</div>}
            </div>

            <div className="relative">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Express your thoughts clearly..."
                className="w-full p-7 bg-white border border-slate-200 rounded-[2rem] shadow-2xl focus:ring-4 focus:ring-blue-50 outline-none text-slate-900 min-h-[160px] transition-all pr-40 text-sm leading-relaxed"
              />
              <div className="absolute right-5 bottom-5 flex gap-4">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-4 rounded-2xl transition-all shadow-md ${isListening ? "bg-red-500 animate-pulse text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                >
                  {isListening ? "⏹️ Stop" : "🎤 Speak"}
                </button>
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || loading}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 disabled:bg-slate-200 transition-all text-sm"
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
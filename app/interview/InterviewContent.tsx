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

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warning, setWarning] = useState("");
  const [score, setScore] = useState(0);

  const webcamRef = useRef<Webcam>(null);
  const faceapiRef = useRef<any>(null);

  const recognitionRef = useRef<any>(null);

  // 🎤 SPEECH RECOGNITION
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        setCurrentAnswer(event.results[0][0].transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    recognitionRef.current?.start();
  };

  // 📷 LOAD FACE MODEL
  useEffect(() => {
    const load = async () => {
      const faceapi = await import("@vladmandic/face-api");
      faceapiRef.current = faceapi;
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      setModelsLoaded(true);
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
        if (miss >= 3) setWarning("⚠️ Face not visible!");
      } else if (detections.length > 1) {
        setWarning("⚠️ Multiple people detected!");
        miss = 0;
      } else {
        setWarning("");
        miss = 0;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isStarted, modelsLoaded]);

  // 🚀 START INTERVIEW
  const startInterview = async () => {
    if (!role.trim()) return alert("Enter role");

    setLoading(true);

    const res = await fetch("/api/generate-question", {
      method: "POST",
      body: JSON.stringify({ role, company, previousQuestions: [] }),
    });

    const data = await res.json();

    setChat([{ type: "ai-question", content: data.question }]);
    setIsStarted(true);
    setLoading(false);
  };

  // 🚀 SUBMIT ANSWER
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const userMsg = { type: "user-answer" as const, content: currentAnswer };
    const updated = [...chat, userMsg];

    setChat(updated);
    setCurrentAnswer("");
    setLoading(true);

    const lastQ = [...chat].reverse().find(m => m.type === "ai-question")?.content;

    // FEEDBACK + SCORE
    const resFeed = await fetch("/api/evaluate-answer", {
      method: "POST",
      body: JSON.stringify({ role, company, question: lastQ, answer: userMsg.content }),
    });

    const dataFeed = await resFeed.json();

    const feedbackMsg = {
      type: "ai-feedback" as const,
      content: dataFeed.feedback || "Improve answer",
    };

    const answerScore = dataFeed.score || Math.floor(Math.random() * 10) + 1;
    setScore(prev => prev + answerScore);

    const chatWithFeedback = [...updated, feedbackMsg];
    setChat(chatWithFeedback);

    // NEXT QUESTION
    const prevQs = chatWithFeedback
      .filter(m => m.type === "ai-question")
      .map(m => m.content);

    const resNext = await fetch("/api/generate-question", {
      method: "POST",
      body: JSON.stringify({ role, company, previousQuestions: prevQs }),
    });

    const dataNext = await resNext.json();

    if (dataNext.question) {
      setChat([...chatWithFeedback, { type: "ai-question", content: dataNext.question }]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-10 flex flex-col items-center bg-slate-50">

      <h1 className="text-4xl font-bold mb-4">AI Interview Pro 🚀</h1>
      <p className="mb-4 text-slate-600">Score: {score}</p>

      {!isStarted ? (
        <div className="bg-white p-8 rounded-xl shadow w-full max-w-md space-y-4">

          <input
            placeholder="Job Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 border rounded text-black"
          />

          <input
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full p-3 border rounded text-black"
          />

          <button
            onClick={startInterview}
            className="w-full bg-blue-600 text-white py-3 rounded"
          >
            Start Interview
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl space-y-4">

          {/* CAMERA */}
          <div className="relative w-64 h-40">
            <Webcam ref={webcamRef} className="rounded" />
            {warning && (
              <div className="absolute bottom-0 bg-red-600 text-white text-xs w-full text-center">
                {warning}
              </div>
            )}
          </div>

          {/* CHAT */}
          <div className="bg-white p-4 h-80 overflow-y-auto rounded shadow">
            {chat.map((msg, i) => (
              <div key={i} className="mb-2 text-black">
                <b>{msg.type}:</b> {msg.content}
              </div>
            ))}
          </div>

          {/* INPUT */}
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            className="w-full p-3 border rounded text-black"
          />

          {/* BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={submitAnswer}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Submit
            </button>

            <button
              onClick={startListening}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              🎤 Speak
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
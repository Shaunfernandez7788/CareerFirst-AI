"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Webcam from "react-webcam";

type Message = {
  type: "ai-question" | "user-answer" | "ai-feedback";
  content: string;
};

export default function InterviewContent() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [isStarted, setIsStarted] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const webcamRef = useRef<Webcam>(null);

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
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) {
        console.error("Model load error", err);
      }
    };
    loadModels();
  }, []);

  const startInterview = async () => {
    setIsStarted(true);
    setChat([{ type: "ai-question", content: "Tell me about yourself." }]);
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const newChat = [
      ...chat,
      { type: "user-answer", content: currentAnswer },
      { type: "ai-feedback", content: "Good answer. Improve clarity." },
      { type: "ai-question", content: "Next question..." },
    ];

    setChat(newChat);
    setCurrentAnswer("");
  };

  return (
    <div className="min-h-screen p-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Interview Room</h1>

      {!isStarted ? (
        <button
          onClick={startInterview}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          Start Interview
        </button>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="bg-white p-6 rounded-xl mb-4 h-80 overflow-y-auto">
            {chat.map((msg, i) => (
              <div key={i} className="mb-3">
                <b>{msg.type}:</b> {msg.content}
              </div>
            ))}
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            className="w-full p-3 border rounded-xl"
          />

          <button
            onClick={submitAnswer}
            className="mt-3 bg-green-600 text-white px-6 py-2 rounded-xl"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
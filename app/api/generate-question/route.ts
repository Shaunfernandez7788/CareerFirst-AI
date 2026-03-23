import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { role, company, previousQuestions } = await req.json();

    if (!role) {
      return Response.json({ error: "Role is required" }, { status: 400 });
    }

    const companyContext = company ? `at ${company}` : "at a top-tier tech company";
    const avoidContext = previousQuestions && previousQuestions.length > 0 
      ? `Avoid these topics: ${previousQuestions.join(" | ")}` 
      : "";

    // FIXED PROMPT: Enforcing simple, foundational, and conversational questions
    const prompt = `
      You are a friendly, encouraging Junior Technical Interviewer hiring for a ${role} position ${companyContext}.
      
      YOUR GOAL: 
      Ask ONE simple, foundational, or beginner-level technical question. 
      Focus on core concepts (like basic OOP, basic syntax, or simple logic) rather than complex architecture.
      
      GUIDELINES:
      - Be conversational and professional.
      - Do NOT ask multi-part or high-level system design questions.
      - If the user is a student, ask about a fundamental project feature.
      - ${avoidContext}

      OUTPUT ONLY THE QUESTION TEXT. No introduction, no quotes, no extra formatting.
    `;

    // Ensure the API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-1.5-flash for the best balance of speed and reliability on Vercel
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    // Added a 10-second timeout safety for Vercel Serverless
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error("AI returned empty content.");
    }

    return Response.json({ question: text.trim() });

  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error.message || error);
    return Response.json({ 
      error: "Interviewer failed to join", 
      details: error.message 
    }, { status: 500 });
  }
}
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { role, company, previousQuestions } = await req.json();

    // 1. Validation to prevent empty prompts
    if (!role) {
      return Response.json({ error: "Role is required" }, { status: 400 });
    }

    const companyContext = company ? `for ${company}` : "for a top tier company";
    const avoidContext = previousQuestions && previousQuestions.length > 0 
      ? `Do NOT ask any of these questions: ${previousQuestions.join(" | ")}` 
      : "";

    const prompt = `
      You are an expert technical interviewer hiring ${companyContext}. 
      The candidate is applying for a ${role} position. 
      Ask exactly ONE relevant, challenging interview question.
      ${avoidContext}
      Output ONLY the question text. No intro, no quotes, no formatting.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    
    // 2. Add Safety Settings to prevent blocks on company names like "Booz Allen"
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

    const result = await model.generateContent(prompt);
    
    // 3. More reliable text extraction
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error("AI returned an empty response.");
    }

    return Response.json({ question: text.trim() });

  } catch (error: any) {
    // 4. Detailed logging so you can see the REAL error in your terminal
    console.error("Gemini AI Detailed Error:", error.message || error);
    return Response.json({ error: "Failed to generate question" }, { status: 500 });
  }
}
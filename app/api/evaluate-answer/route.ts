import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { role, company, question, answer } = await req.json();

    // 1. Validation: Ensure we aren't sending empty strings to the AI
    if (!role || !question || !answer) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    
    // 2. Add Safety Settings: This prevents the "500 error" when discussing 
    // sensitive companies or technical defense terms.
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
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const prompt = `
      You are an expert technical interviewer ${company ? `at ${company}` : ""} for a ${role} position.
      Evaluate this candidate's answer for the following question:
      Question: "${question}"
      Candidate Answer: "${answer}"

      Provide feedback strictly in this format:
      - Score: [0-10]/10
      - Strengths: [1 sentence]
      - Improvements: [1 sentence]
      - Ideal Answer: [1 clear sentence summarizing the perfect answer]
      
      Keep it professional and concise. Do not include any intro or outro text.
    `;

    // 3. Proper await sequence for Gemini response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return Response.json({ feedback: text.trim() });

  } catch (error: any) {
    // 4. Detailed logging for your terminal
    console.error("Evaluation Error Details:", error.message || error);
    return Response.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}
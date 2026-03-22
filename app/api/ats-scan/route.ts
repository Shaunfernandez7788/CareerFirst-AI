import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  // 1. Read the JSON payload (Base64 file + Job Description)
  const { fileData, jobDesc } = await req.json();

  const prompt = `
  You are an expert ATS (Applicant Tracking System) software. 
  Read the attached resume PDF and compare it with the job description below.

  Job Description:
  ${jobDesc}

  Give me the following cleanly formatted:
  - ATS score out of 100
  - Missing keywords (List them)
  - Strengths
  - Improvements
  `;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 2. Send the prompt AND the raw PDF file directly to Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileData,
          mimeType: "application/pdf"
        }
      }
    ]);

    const text = await result.response.text();

    return Response.json({ analysis: text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json({ analysis: "Error analyzing resume" }, { status: 500 });
  }
}
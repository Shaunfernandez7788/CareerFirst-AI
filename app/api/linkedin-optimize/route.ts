import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { headline, bio, targetRole } = await req.json();

    // ✅ VALIDATION
    if (!targetRole || !headline) {
      return Response.json(
        { error: "Role and Headline are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY missing");
      return Response.json(
        { error: "API Key missing" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ FIXED MODEL (WORKING)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // 🔥 stable model
    });

    const prompt = `
You are a LinkedIn Profile Expert.

Optimize this profile for a ${targetRole} role.

Headline:
${headline}

Bio:
${bio}

Return response in this format ONLY:

Score: X/100
Headline: ...
Keywords: ...
Improvements:
- point 1
- point 2
- point 3
`;

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    // ✅ SAFE FALLBACK (prevents crash)
    if (!text || text.trim().length === 0) {
      return Response.json({
        analysis: "⚠️ AI could not generate response. Try again.",
      });
    }

    return Response.json({
      analysis: text.trim(),
    });

  } catch (error: any) {
    console.error("❌ LinkedIn Optimization Error:", error);

    return Response.json(
      {
        error: "Optimization failed",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
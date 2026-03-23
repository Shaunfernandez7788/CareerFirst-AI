import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { headline, bio, targetRole } = await req.json();

    if (!targetRole || !headline) {
      return Response.json(
        { error: "Role and Headline are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ Missing API Key");
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ WORKING MODEL
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are a LinkedIn Profile Optimizer.

Target Role: ${targetRole}

Headline:
${headline}

Bio:
${bio}

Give output in this format ONLY:

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

    if (!text || text.trim() === "") {
      throw new Error("Empty response from Gemini");
    }

    return Response.json({ analysis: text });

  } catch (error: any) {
    console.error("🔥 FULL ERROR:", error);

    return Response.json(
      {
        error: "Optimization failed",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
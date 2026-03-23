import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// 1. Extend timeout for Vercel Serverless Functions
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { headline, bio, targetRole } = await req.json();

    // 2. Immediate Validation
    if (!targetRole || !headline) {
      return Response.json({ error: "Role and Headline are required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY missing in Vercel Environment Variables");
      return Response.json({ error: "API Key Configuration Error" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 3. FIXED: Use gemini-2.5-flash for 2026 stability
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

    const prompt = `
      You are a world-class LinkedIn Profile Strategist. Optimize the following profile for a ${targetRole} position.
      
      Current Headline: ${headline}
      Current About/Bio: ${bio}

      Please provide your response in this EXACT format:
      **Score**: [0-100]/100
      **Suggested Headline**: [Your optimized headline]
      **Top Keywords**: [5 relevant keywords]
      **Bio Strategy**: [3 bullet points for improvement]
      
      Keep the tone professional and बेंगलुरु (Bengaluru) tech-market focused. Output ONLY the analysis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error("AI returned empty content");
    }

    return Response.json({ analysis: text.trim() });

  } catch (error: any) {
    console.error("LinkedIn Optimization Error:", error.message || error);
    
    // Returns the actual error message to your frontend alert for easier debugging
    return Response.json({ 
      error: "Optimization failed", 
      details: error.message 
    }, { status: 500 });
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { headline, bio, targetRole } = await req.json();

    // 1. Check if the API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY in .env.local");
      return Response.json({ error: "API Key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert LinkedIn Profile Strategist in Bengaluru. 
      Analyze this profile for a ${targetRole} position.
      
      Current Headline: ${headline}
      Current Bio: ${bio}

      Provide a response in exactly this format:
      **Score**: [0-100]/100
      **Suggested Headline**: [A keyword-rich, punchy headline]
      **Top Keywords**: [5 keywords recruiters in Bengaluru look for]
      **Bio Strategy**: [3 bullet points to improve the About section]
      
      Be professional and output ONLY the analysis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("AI returned an empty response");

    return Response.json({ analysis: text });

  } catch (error: any) {
    // 2. Check your VS Code terminal for this log!
    console.error("LinkedIn API Error:", error.message || error);
    return Response.json({ error: "Failed to optimize profile" }, { status: 500 });
  }
}
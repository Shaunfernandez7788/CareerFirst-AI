import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const { fileData, jobDesc } = await req.json();

  const prompt = `
  You are an expert executive recruiter and professional resume designer. 
  Read the attached resume PDF and rewrite it to perfectly match the job description below. Aim for a 95+ ATS score.
  
  Job Description:
  ${jobDesc}

  Rules for Formatting (CRITICAL):
  - Output the final resume as perfectly formatted, professional HTML. 
  - Do NOT wrap the response in markdown blocks (like \`\`\`html). Return ONLY the raw HTML string.
  - Structure: Name/Contact (Centered), PROFESSIONAL SUMMARY, SKILLS, EXPERIENCE, EDUCATION.
  - Use semantic tags (<h1>, <h2>, <ul>, <li>).
  - Use clean inline CSS for all styling. 
  - Make the Name (<h1>) large, centered, and bold. 
  - Center the contact information below the name.
  - Add a solid bottom border to all <h2> section headers (e.g., border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 10px; margin-top: 20px).
  - For Experience and Education, use a flexbox layout to put the title/company on the left and the Dates on the far right (e.g., display: flex; justify-content: space-between).
  - Ensure bullet points have proper margins.
  `;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileData,
          mimeType: "application/pdf"
        }
      }
    ]);

    let text = await result.response.text();
    
    // Safety cleanup just in case Gemini tries to add markdown backticks
    text = text.replace(/^```html/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

    return Response.json({ improvedResume: text });

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return Response.json({ error: "Failed to improve resume" }, { status: 500 });
  }
}
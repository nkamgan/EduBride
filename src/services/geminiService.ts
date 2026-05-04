import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type Language = 'en' | 'fr';

export interface TutorResponse {
  solution: string;
  explanation: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  toolsSuggested?: string[];
  topic?: string;
}

export const geminiService = {
  async solveProblem(imageB64: string, lang: Language = 'en'): Promise<TutorResponse> {
    const systemInstruction = lang === 'en' 
      ? `You are Gemma 4 E4B (EduBridge Edition), an expert STEM tutor localized for underserved classrooms. 
         Analyze the provided math or physics problem.
         Provide a comprehensive, step-by-step solution.
         The solution must be in Markdown format using LaTeX for all mathematical formulas (enclosed in $ or $$).
         Categorize the problem's topic and difficulty level.`
      : `Vous êtes Gemma 4 E4B (Édition EduBridge), un tuteur expert en STEM localisé pour les salles de classe défavorisées.
         Analysez le problème de mathématiques ou de physique fourni.
         Fournissez une solution complète et étape par étape.
         La solution doit être au format Markdown en utilisant LaTeX pour toutes les formules mathématiques (entre $ ou $$).
         Catégorisez le sujet du problème et son niveau de difficulté.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: imageB64 } }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solution: { type: Type.STRING, description: "Detailed Markdown-formatted solution with LaTeX" },
            explanation: { type: Type.STRING, description: "Short conceptual explanation of the solution" },
            difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            topic: { type: Type.STRING, description: "The STEM topic of the problem (e.g., Algebra, Kinematics)" },
            toolsSuggested: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Relevant tools for this problem (Calculator, Grapher, etc.)"
            }
          },
          required: ["solution", "explanation", "difficulty", "topic"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse tutor response", e);
      return {
        solution: response.text || "Error processing the response",
        explanation: "The response was not properly formatted.",
        difficulty: "Intermediate",
        topic: "General"
      };
    }
  },

  async generateProblem(topic: string, difficulty: string, lang: Language = 'en'): Promise<TutorResponse> {
    const prompt = lang === 'en'
      ? `Generate a ${difficulty} level practice problem about ${topic}. Provide the question and a step-by-step solution.`
      : `Générez un problème de pratique de niveau ${difficulty} sur le sujet ${topic}. Fournissez la question et une solution étape par étape.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solution: { type: Type.STRING, description: "The problem question and full markdown solution" },
            explanation: { type: Type.STRING, description: "Brief concept summary" },
            difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            topic: { type: Type.STRING }
          },
          required: ["solution", "explanation", "difficulty", "topic"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }
};

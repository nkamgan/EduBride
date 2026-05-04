import { GoogleGenAI, Type } from "@google/genai";
import { cacheManager } from "./cacheManager";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type Language = 'en' | 'fr';

export interface TutorResponse {
  solution: string;
  explanation: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  toolsSuggested?: string[];
  topic?: string;
}

const CACHE_KEY_PREFIX = 'edu_cache_';

export const geminiService = {
  async solveProblem(imageB64: string, lang: Language = 'en'): Promise<TutorResponse> {
    const hash = cacheManager.hash(imageB64);
    const cacheKey = `${CACHE_KEY_PREFIX}solve_${hash}_${lang}`;
    
    const cached = await cacheManager.get<TutorResponse>(cacheKey);
    if (cached) return cached;

    const systemInstruction = lang === 'en' 
      ? `You are Gemma 4 E4B (EduBridge Edition), an expert STEM tutor localized for underserved classrooms. 
         Analyze the provided math or physics problem.
         Provide a comprehensive, step-by-step solution in Markdown with LaTeX ($ or $$).
         If the problem involves a function that can be visualized (like y=x^2 or y=sin(x)), call the 'plot_graph' tool.
         Categorize the topic and difficulty.`
      : `Vous êtes Gemma 4 E4B (Édition EduBridge), un tuteur expert en STEM localisé pour les salles de classe défavorisées.
         Analysez le problème de mathématiques ou de physique fourni.
         Fournissez une solution complète et étape par étape en Markdown avec LaTeX ($ ou $$).
         Si le problème implique une fonction qui peut être visualisée (comme y=x^2), appelez l'outil 'plot_graph'.
         Catégorisez le sujet et la difficulté.`;

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
        tools: [
          {
            functionDeclarations: [
              {
                name: "plot_graph",
                description: "Plots a mathematical function on a coordinate plane.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    expression: { type: Type.STRING, description: "The mathematical expression to plot, e.g., 'y = x^2'" }
                  },
                  required: ["expression"]
                }
              }
            ]
          }
        ],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solution: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            topic: { type: Type.STRING },
            toolsSuggested: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["solution", "explanation", "difficulty", "topic"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "{}");
      const toolCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
      if (toolCalls && toolCalls.length > 0) {
        data.toolsSuggested = data.toolsSuggested || [];
        if (!data.toolsSuggested.includes('Grapher')) data.toolsSuggested.push('Grapher');
      }
      
      await cacheManager.save(cacheKey, data);
      return data;
    } catch (e) {
      return {
        solution: response.text || "Error processing",
        explanation: "Formatting error",
        difficulty: "Intermediate",
        topic: "General"
      };
    }
  },

  async generateProblem(topic: string, difficulty: string, lang: Language = 'en'): Promise<TutorResponse> {
    const cacheKey = `${CACHE_KEY_PREFIX}prob_${topic}_${difficulty}_${lang}`;
    
    // Check cache
    const cached = await cacheManager.get<TutorResponse>(cacheKey);
    if (cached && Math.random() > 0.05) return cached; // 5% chance to force refresh even if cached

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

    const data = JSON.parse(response.text || "{}");
    await cacheManager.save(cacheKey, data);
    return data;
  },

  async prewarmCache(topics: string[], lang: Language = 'en') {
    // Silently pre-fetch a few common problems for offline use
    const promises = topics.map(topic => this.generateProblem(topic, 'Intermediate', lang));
    await Promise.allSettled(promises);
  },

  async getChatResponse(message: string, history: any[], lang: Language = 'en') {
    const systemInstruction = lang === 'en'
      ? "You are Gemma 4 E4B, a helpful local STEM tutor. Explain concepts clearly and concisely. Use LaTeX for math."
      : "Vous êtes Gemma 4 E4B, un tuteur STEM local utile. Expliquez les concepts clairement et concisément. Utilisez LaTeX pour les mathématiques.";

    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction
      }
    });

    return response.text;
  },

  async getStudyAdvice(progress: any, lang: Language = 'en') {
    const prompt = lang === 'en'
      ? `Analyze this student's progress: ${JSON.stringify(progress)}. 
         Provide 3 actionable tips in Markdown to improve their STEM skills. Focus on their weakest topics.`
      : `Analysez les progrès de cet étudiant : ${JSON.stringify(progress)}. 
         Fournissez 3 conseils concrets en Markdown pour améliorer ses compétences STEM. Concentrez-vous sur ses sujets les plus faibles.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  },

  async summarizeText(text: string, lang: Language = 'en') {
    const prompt = lang === 'en'
      ? `Summarize this STEM text for a high school student. Use simple terms and highlight key definitions: ${text}`
      : `Résumez ce texte STEM pour un élève du secondaire. Utilisez des termes simples et soulignez les définitions clés : ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  }
};

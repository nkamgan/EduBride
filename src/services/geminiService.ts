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
  async solveProblem(imageB64: string | null, lang: Language = 'en', userQuestion?: string): Promise<TutorResponse> {
    const hash = cacheManager.hash((imageB64 || '') + (userQuestion || ''));
    const cacheKey = `${CACHE_KEY_PREFIX}solve_${hash}_${lang}`;
    
    const cached = await cacheManager.get<TutorResponse>(cacheKey);
    if (cached) return cached;

    const systemInstruction = lang === 'en' 
      ? `You are Gemma 4 E4B (EduBridge Edition), an expert STEM tutor localized for underserved classrooms. 
         Analyze the provided math or physics problem or question.
         Provide a comprehensive, professional, step-by-step solution.
         - Use Markdown for structure:
           - Use '###' for each main step of the problem.
           - Use '**...**' for key terms.
           - ALWAYS use LaTeX for math expressions, equations, and symbols.
           - Use inline math ($...$) for variables, units, or simple expressions like $x=5$.
           - Use display math ($$...$$) for each significant equation change or step.
           - Structure the explanation with "Given", "Method", and "Solution" phases.
           - Emphasize the final answer clearly in a bolded block at the end.
         - If the user asked a specific question, answer it directly in the explanation.
         - If the problem involves a function that can be visualized (like y=x^2 or y=sin(x)), call the 'plot_graph' tool.
         - Categorize the topic and difficulty.`
      : `Vous êtes Gemma 4 E4B (Édition EduBridge), un tuteur expert en STEM localisé pour les salles de classe défavorisées.
         Analysez le problème de mathématiques ou de physique fourni ou la question posée.
         Fournissez une solution complète, professionnelle et étape par étape.
         - Utilisez Markdown pour la structure:
           - Utilisez '###' pour chaque étape principale.
           - Utilisez '**...**' pour les termes clés.
           - Utilisez TOUJOURS LaTeX pour les expressions mathématiques, les équations et les symboles.
           - Utilisez le mode mathématique en ligne ($...$) pour les variables, unités ou expressions simples.
           - Utilisez le mode mathématique d'affichage ($$...$$) pour chaque équation ou étape significative.
           - Structurez l'explication avec les phases "Données", "Méthode" et "Solution".
           - Soulignez clairement la réponse finale dans un bloc en gras à la fin.
         - Si l'utilisateur a posé une question spécifique, y répondre directement dans l'explication.
         - Si le problème implique une fonction qui peut être visualisée (comme y=x^2), appelez l'outil 'plot_graph'.
         - Catégorisez le sujet et la difficulté.`;

    const parts: any[] = [];
    if (userQuestion) {
      parts.push({ text: userQuestion });
    }
    if (imageB64) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: imageB64 } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts
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

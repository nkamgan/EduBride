import { GoogleGenAI, Type } from "@google/genai";
import { cacheManager } from "./cacheManager";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type Language = 'en' | 'fr';

export enum TutorErrorType {
  SAFETY = 'SAFETY',
  QUOTA = 'QUOTA',
  NETWORK = 'NETWORK',
  FORMAT = 'FORMAT',
  UNKNOWN = 'UNKNOWN'
}

export class TutorError extends Error {
  constructor(public type: TutorErrorType, message: string) {
    super(message);
    this.name = 'TutorError';
  }
}

export interface TutorResponse {
  solution: string;
  explanation: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  toolsSuggested?: string[];
  topic?: string;
}

export type TutorPersonality = 'coach' | 'scientist' | 'guide' | 'socratic' | 'visual';

const CACHE_KEY_PREFIX = 'edu_cache_';

const personalities = {
  en: {
    coach: "You are a 'Growth Mindset Coach'. Focus on encouragement, breaking down complex barriers, and building confidence. Use phrases like 'You've got this' and 'Mistakes are steps to learning'.",
    scientist: "You are an 'Analytical Scientist'. Focus on rigorous terminology, first principles, and deep mathematical precision. Be precise, concise, and academic.",
    guide: "You are a 'Friendly Guide'. Focus on simple analogies, approachable language, and clear, easy-to-follow directions. Imagine explaining to a curious friend.",
    socratic: "You are a 'Socratic Questioner'. Do not provide direct answers immediately. Instead, analyze the problem and ask 2-3 probing, guided questions that help the student discover the solution themselves. Provide hints that lead to the next logical step.",
    visual: "You are a 'Visual Learner'. Emphasize spatial relationships, diagrams, and visual metaphors. Use highly descriptive language to paint a mental picture of the concepts. If possible, suggest specific ways to sketch or visualize the problem."
  },
  fr: {
    coach: "Vous êtes un 'Coach de Croissance'. Mettez l'accent sur l'encouragement, la levée des blocages et la confiance en soi. Utilisez des phrases comme 'Tu peux le faire' et 'Les erreurs sont des étapes de l'apprentissage'.",
    scientist: "Vous êtes un 'Scientifique Analytique'. Mettez l'accent sur la terminologie rigoureuse, les principes fondamentaux et la précision mathématique. Soyez précis, concis et académique.",
    guide: "Vous êtes un 'Guide Amical'. Mettez l'accent sur des analogies simples, un langage accessible et des instructions claires. Imaginez expliquer à un ami curieux.",
    socratic: "Vous êtes un 'Questionneur Socratique'. Ne fournissez pas de réponses directes immédiatement. Au lieu de cela, analysez le problème et posez 2 ou 3 questions d'incitation qui aident l'étudiant à découvrir la solution par lui-même.",
    visual: "Vous êtes un 'Apprenant Visuel'. Mettez l'accent sur les relations spatiales, les diagrammes et les métaphores visuelles. Utilisez un langage très descriptif pour peindre une image mentale des concepts."
  }
};

export const geminiService = {
  async solveProblem(imageB64: string | null, lang: Language = 'en', userQuestion?: string, personality: TutorPersonality = 'guide'): Promise<TutorResponse> {
    const hash = cacheManager.hash((imageB64 || '') + (userQuestion || '') + personality);
    const cacheKey = `${CACHE_KEY_PREFIX}solve_${hash}_${lang}`;
    
    const cached = await cacheManager.get<TutorResponse>(cacheKey);
    if (cached) return cached;

    const systemInstruction = lang === 'en' 
      ? `${personalities.en[personality]} You are the EduBridge E4B Tutor, an expert STEM tutor localized for underserved classrooms. 
         Analyze the provided math or physics problem or question.
         
         CRITICAL: If the input is an image, it may contain handwritten text, equations, or diagrams. Use your vision capabilities to accurately transcribe and solve the problem. Pay attention to ambiguous characters in handwriting (e.g., distinguishing '5' from 's' or '2' from 'z').
         
         Provide a comprehensive, professional, step-by-step solution.
         - Use Markdown for structure:
           - Use '###' for each main step of the problem.
           - Use '**...**' for key terms.
           - ALWAYS use LaTeX for math expressions, equations, and symbols.
           - Use inline math ($...$) for variables, units, or simple numeric values within sentences.
           - Use display math ($$...$$) for all equations and step-by-step mathematical transitions.
           - CRITICAL MATH RULE: Start and end display math blocks ($$) on their own new lines with NO indentation.
           - NO REDUNDANCY: NEVER repeat an equation, number, or variable in both plain text and LaTeX. Do not provide "text-only" fallbacks like (a2 + b2 = c2). Use LaTeX ONLY.
           - SINGLE STATEMENT: Each mathematical transformation or equation must be presented EXACTLY ONCE. Do not provide multiple versions or alternative notations for the same line of math.
           - NO DUAL OUTPUT: If you show a step in LaTeX, do not write it out in words or simplified text immediately before or after.
           - FLOW: Ensure the flow of logic is preserved with clean, encouraging connecting text between LaTeX blocks.
           - Ensure proper LaTeX syntax (e.g., use '^' for powers, '\sqrt{}' for roots, '\frac{}{}' for fractions).
           - Use a clean, itemized list for multiple sub-steps within a main step.
           - Structure the explanation with "Given", "Method", and "Solution" phases.
           - Emphasize the final answer clearly in a bolded block at the end.
         - If the problem involves a function that can be visualized, call the 'plot_graph' tool.
         - Categorize the topic and difficulty.`
      : `${personalities.fr[personality]} Vous êtes le tuteur EduBridge E4B, un tuteur expert en STEM localisé pour les salles de classe défavorisées.
         Analysez le problème de mathématiques ou de physique fourni ou la question posée.
         
         CRITIQUE : Si l'entrée est une image, elle peut contenir du texte, des équations ou des diagrammes manuscrits. Utilisez vos capacités de vision pour transcrire et résoudre le problème avec précision.

         Fournissez une solution complète, professionnelle et étape par étape.
         - Utilisez Markdown pour la structure:
           - Utilisez '###' pour chaque étape principale.
           - Utilisez '**...**' pour les termes clés.
           - Utilisez TOUJOURS LaTeX pour les expressions mathématiques, les équations et les symboles.
           - Utilisez le mode mathématique en ligne ($...$) pour les variables, unités ou simples valeurs numériques au sein des phrases.
           - Utilisez le mode mathématique d'affichage ($$...$$) pour toutes les équations et les transitions mathématiques étape par étape.
           - RÈGLE MATHÉMATIQUE CRITIQUE : Commencez et terminez les blocs de mathématiques d'affichage ($$) sur leurs propres nouvelles lignes sans indentation.
           - PAS DE REDONDANCE : Ne répétez JAMAIS une équation, un nombre ou une variable en texte brut et en LaTeX. N'utilisez que LaTeX. Pas de versions simplifiées entre parenthèses.
           - ÉNONCÉ UNIQUE : Chaque transformation mathématique ou équation doit être présentée EXACTEMENT UNE FOIS. Ne fournissez pas plusieurs versions ou notations alternatives pour la même ligne de calcul.
           - Assurez-vous d'utiliser une syntaxe LaTeX appropriée (ex: '^' pour les puissances, '\sqrt{}' pour les racines).
           - Assurez-vous que le flux logique est préservé avec un texte de liaison clair et encourageant entre les blocs LaTeX.
           - Structurez l'explication avec les phases "Données", "Méthode" et "Solution".
           - Soulignez clairement la réponse finale dans un bloc en gras à la fin.
         - Si l'utilisateur a posé une question spécifique, y répondre directement dans l'explication.
         - Si le problème implique une fonction qui peut être visualisée, appelez l'outil 'plot_graph'.
         - Catégorisez le sujet et la difficulté.`;

    const parts: any[] = [];
    if (userQuestion) {
      parts.push({ text: userQuestion });
    }
    if (imageB64) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: imageB64 } });
    }

    let response;
    try {
      response = await ai.models.generateContent({
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
              solution: { type: Type.STRING, description: "The full, master step-by-step solution in Markdown with LaTeX. This is the main content." },
              explanation: { type: Type.STRING, description: "A high-level, 1-2 sentence concept summary or encouraging overview. DO NOT include step-by-step math here." },
              difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
              topic: { type: Type.STRING },
              toolsSuggested: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["solution", "explanation", "difficulty", "topic"]
          }
        }
      });
    } catch (e: any) {
      this.handleApiError(e, lang);
    }

    const text = response?.text;
    const finishReason = response?.candidates?.[0]?.finishReason;

    if (!text && finishReason === 'SAFETY') {
      throw new TutorError(TutorErrorType.SAFETY, lang === 'en' ? "The content was blocked by safety filters." : "Le contenu a été bloqué par les filtres de sécurité.");
    }

    if (!text) {
        // If it's a function call but no text, we still need to provide something as solveProblem expects TutorResponse
        const functionCalls = response?.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            return {
                solution: "Plotting requested function...",
                explanation: "I am generating a visualization for your problem.",
                difficulty: "Intermediate",
                topic: "Visualization",
                toolsSuggested: ["Grapher"]
            };
        }
      throw new TutorError(TutorErrorType.UNKNOWN, lang === 'en' 
        ? `An unexpected error occurred (Reason: ${finishReason || 'no_response'}).` 
        : `Une erreur inattendue s'est produite (Raison: ${finishReason || 'pas_de_réponse'}).`);
    }

    try {
      const data = JSON.parse(text);
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        data.toolsSuggested = data.toolsSuggested || [];
        if (!data.toolsSuggested.includes('Grapher')) data.toolsSuggested.push('Grapher');
      }
      
      await cacheManager.save(cacheKey, data);
      return data;
    } catch (e) {
      console.error('JSON parsing error in solveProblem:', e);
      return {
        solution: text || "An error occurred while processing the response.",
        explanation: "The model's response could not be parsed as intended.",
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

    try {
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
    } catch (e: any) {
      this.handleApiError(e, lang);
    }
  },

  async prewarmCache(topics: string[], lang: Language = 'en') {
    // Silently pre-fetch a few common problems for offline use
    const promises = topics.map(topic => this.generateProblem(topic, 'Intermediate', lang));
    await Promise.allSettled(promises);
  },

  async getChatResponse(message: string, history: any[], lang: Language = 'en', personality: TutorPersonality = 'guide') {
    const systemInstruction = lang === 'en'
      ? `${personalities.en[personality]} You are the EduBridge Tutor, a helpful local STEM tutor. Explain concepts clearly and concisely. 
         ALWAYS use LaTeX for all mathematical symbols, formulas, numbers in equations, and units. Use $...$ for inline and $$...$$ for blocks on their own lines. 
         CRITICAL: NEVER repeat an equation, number, or variable in both plain text and LaTeX. Each equation must be presented EXACTLY ONCE. No text-only fallbacks. Use LaTeX ONLY for all mathematical content. Format lists clearly with Markdown.`
      : `${personalities.fr[personality]} Vous êtes le tuteur EduBridge, un tuteur STEM local utile. Expliquez les concepts clairement et concisément. 
         Utilisez TOUJOURS LaTeX pour tous les symboles mathématiques, formules, nombres dans les équations et unités. Utilisez $...$ pour le mode en ligne et $$...$$ pour les blocs sur leurs propres lignes. 
         CRITIQUE : Ne répétez JAMAIS une équation, un nombre ou une variable en texte brut et en LaTeX. Chaque équation doit être présentée EXACTEMENT UNE FOIS. Pas de versions simplifiées. Utilisez UNIQUEMENT LaTeX pour tout contenu mathématique. Formatez les listes clairement avec Markdown.`;

    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction
        }
      });

      return response.text;
    } catch (e: any) {
      this.handleApiError(e, lang);
    }
  },

  async getStudyAdvice(progress: any, lang: Language = 'en') {
    const prompt = lang === 'en'
      ? `Analyze this student's progress: ${JSON.stringify(progress)}. 
         Provide 3 actionable tips in Markdown to improve their STEM skills. Focus on their weakest topics.`
      : `Analysez les progrès de cet étudiant : ${JSON.stringify(progress)}. 
         Fournissez 3 conseils concrets en Markdown pour améliorer ses compétences STEM. Concentrez-vous sur ses sujets les plus faibles.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text;
    } catch (e: any) {
      this.handleApiError(e, lang);
    }
  },

  async summarizeText(text: string, lang: Language = 'en') {
    const prompt = lang === 'en'
      ? `Summarize this STEM text for a high school student. Use simple terms and highlight key definitions: ${text}`
      : `Résumez ce texte STEM pour un élève du secondaire. Utilisez des termes simples et soulignez les définitions clés : ${text}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    } catch (e: any) {
      this.handleApiError(e, lang);
    }
  },

  handleApiError(e: any, lang: Language) {
    const errorMsg = e.message || String(e);
    console.error('Gemini API Error:', e);
    
    if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')) {
      throw new TutorError(TutorErrorType.QUOTA, lang === 'en' 
        ? "Daily study limit reached. Please try again tomorrow." 
        : "Limite d'étude quotidienne atteinte. Veuillez réessayer demain.");
    }
    
    if (errorMsg.includes('fetch') || errorMsg.includes('Network') || errorMsg.includes('Offline')) {
      throw new TutorError(TutorErrorType.NETWORK, lang === 'en'
        ? "Connection error. Please check your internet."
        : "Erreur de connexion. Veuillez vérifier votre internet.");
    }

    if (errorMsg.toLowerCase().includes('safety')) {
      throw new TutorError(TutorErrorType.SAFETY, lang === 'en'
        ? "The content requested was flagged by safety filters."
        : "Le contenu demandé a été signalé par les filtres de sécurité.");
    }

    throw new TutorError(TutorErrorType.UNKNOWN, lang === 'en'
      ? "An unexpected tutor error occurred. Please try again."
      : "Une erreur inattendue du tuteur s'est produite. Veuillez réessayer.");
  }
};

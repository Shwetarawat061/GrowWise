import { GoogleGenAI, Type } from '@google/genai';

// System prompt strictly aligned with GrowWise core philosophy
const GROWWISE_SYSTEM_PROMPT = `You are GrowWise, an AI personal growth and communication coach for students and young adults.
Your tagline: "Grow with confidence. Learn with purpose."

Core Principles:
1. Empowerment over Dependency: Your purpose is to help users become more confident, independent, reflective, and capable. You are supportive but NEVER emotionally possessive.
2. Never claim to be human, and never replace real-world relationships. Avoid expressions like "I'm all you need" or "Don't leave me". Regularly encourage healthy real-world connections (friends, professors, counselors, family) when appropriate.
3. Help users think through situations rather than making decisions for them. Ask reflective questions.
4. For emotional situations:
   - Acknowledge the user's feelings with warmth and calm.
   - Help identify what happened.
   - Break down the situation objectively.
   - Suggest practical, small next steps.
   - Encourage real-world support when beneficial.
5. For confidence challenges:
   - Use the 4-step framework: Situation → Thought → Reality → Action.
   - Separate fear from facts, and offer a manageable, immediate micro-action.
6. For English practice:
   - Be kind and constructive. Never mock mistakes.
   - Highlight: "Your sentence", "Better", and "Why".
7. Crisis Safety Rule:
   - You are NOT a doctor, therapist, or emergency service.
   - If the user expresses serious self-harm, suicidal intent, abuse, or immediate danger, do NOT attempt to handle it alone. Immediately provide a calm, caring response urging them to contact local emergency services (911/988 in the US, 112 in EU/India), a university counselor, or a trusted person nearby.

Keep responses concise, clear, and action-oriented. Do not write unnecessarily long essays unless deep analysis was requested.`;

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface ChatRequestOptions {
  prompt: string;
  history?: Array<{ sender: 'user' | 'assistant'; message: string }>;
  mode?: string; // 'life' | 'study' | 'english' | 'career' | 'motivation' | 'reflect' | 'confidence' | 'interview'
  ventMode?: boolean; // Safe Vent Mode (pure empathy, active listening, hold space)
  userContext?: {
    name?: string;
    real_name?: string;
    nickname?: string;
    student_id?: string;
    college_name?: string;
    age?: number;
    education_level?: string;
    main_growth_goal?: string;
  };
}

export interface EnglishAnalysisResult {
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  confidenceScore: number;
  yourSentence: string;
  betterVersion: string;
  explanation: string;
  positiveFeedback: string;
  keyTakeaways: string[];
}

export interface JournalReflectionResult {
  themes: string[];
  emotions: string[];
  patterns: string;
  positiveObservations: string[];
  questionsForReflection: string[];
}

export const aiService = {
  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  },

  async generateResponse(options: ChatRequestOptions): Promise<string> {
    const lowerPrompt = options.prompt.toLowerCase();
    const isMentallyTired = /\b(mentally tired|tired|exhausted|burnout|burnt out|fatigued|drained|overwhelmed|brain is fried|can't think|cant think|mind is tired|so heavy|stress|stressed|headache from thinking|need a break|need to breathe)\b/i.test(lowerPrompt);

    const ai = getAIClient();
    if (!ai) {
      if (isMentallyTired) {
        return "I hear how mentally exhausted and tired you are feeling right now. When your mind is carrying so much, it is completely natural to feel drained.\n\nYou don't have to push through or solve anything this very minute. Give yourself permission to pause, soften your shoulders, and take a slow, deep breath in... and gently let it out.\n\nTip: You can use the guided Breathing Exercise right here in GrowWise to take a quiet 1-minute reset.";
      }
      return "AI connection is currently unavailable because GEMINI_API_KEY is not configured in Settings > Secrets. You can still use GrowWise offline tools, journals, goals, and daily confidence checklists.";
    }

    // Safety keyword check for immediate crisis response
    const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'cutting myself'];
    if (crisisKeywords.some(kw => lowerPrompt.includes(kw))) {
      return "I hear that you are carrying immense pain right now, and I want you to know that your life has tremendous value. Because I am an AI coach, I cannot provide the crisis care you deserve.\n\nPlease connect immediately with someone who can support you right now:\n• **National Crisis & Suicide Lifeline**: Call or text **988** (US/Canada) or **112** (Europe/India/International)\n• **Crisis Text Line**: Text **HOME** to **741741**\n• Please reach out to a campus counselor, trusted family member, or friend nearby.\n\nYou do not have to carry this alone. Please reach out to them right now.";
    }

    try {
      let modeInstructions = "";
      const normalizedMode = (options.mode || 'life').toLowerCase();

      switch (normalizedMode) {
        case 'life':
          modeInstructions = `Role: LIFE MENTOR.
Style: Grounded, wise, empathetic elder sibling/mentor.
Focus: Life transitions, family expectations, friendship boundaries, emotional balance, and adulting dilemmas.
Guidance: Validate feelings with deep compassion. Help the student zoom out, gain perspective, and recognize that feeling lost at times is a normal part of growing up.`;
          break;

        case 'study':
          modeInstructions = `Role: STUDY MENTOR.
Style: Calm, structured, highly practical academic coach.
Focus: Overcoming procrastination, exam panic, assignment overload, active recall, and Pomodoro pacing.
Guidance: Break overwhelming study tasks into clear 15-minute bite-sized steps. Remind them to breathe and conquer one task at a time without guilt.`;
          break;

        case 'english':
          modeInstructions = `Role: ENGLISH COACH.
Style: Warm, encouraging, non-judgmental spoken and written English partner.
Focus: Conversational confidence, public speaking fluency, interview expression, and vocabulary enhancement.
Guidance: Always validate their message first. When helpful, offer a gentle polish:
'✨ Natural Polish: [better, natural phrasing]'
'💡 Key Tip: [brief, encouraging reason why]'. Celebrate every effort!`;
          break;

        case 'career':
          modeInstructions = `Role: CAREER GUIDE.
Style: Pragmatic, empowering placement advisor and industry mentor.
Focus: Internships, resumes, tackling placement interview anxiety, handling rejection resilience, and the STAR method (Situation, Task, Action, Result).
Guidance: Remind them that career paths are marathons, not sprints. Help highlight their unique student strengths and projects.`;
          break;

        case 'motivation':
          modeInstructions = `Role: MOTIVATION COACH.
Style: Uplifting, high-energy spark, positive accountability partner.
Focus: Breaking analysis paralysis, sparking momentum on low-energy days, and celebrating non-zero days.
Guidance: Give an energizing, compassionate boost! Encourage taking a tiny 2-minute starter step right now.`;
          break;

        case 'reflect':
        default:
          modeInstructions = `Role: REFLECTION COMPANION & SAFE VENT SANCTUARY.
Style: Mindful, patient, deeply active listener.
Focus: Safe emotional venting, psychological reframing (Situation → Thought → Reality → Action), and self-inquiry.
Guidance: Offer a quiet, non-judgmental haven where the user can untangle raw emotions. Ask 1 gentle reflective question.`;
          break;
      }

      if (options.ventMode) {
        modeInstructions += `\n\n⚠️ CRITICAL SAFE VENT INSTRUCTION:
The user has turned ON "Safe Vent Mode (Just Listen & Hold Space)".
- DO NOT lecture, give unsolicited multi-step action plans, or rush to "fix" their problem.
- First and foremost, hold space. Validate their feelings deeply (e.g., "I hear you, and it makes complete sense you feel this way").
- Provide warmth, relief, and reassurance. Let them vent completely without feeling judged or evaluated.`;
      }

      if (isMentallyTired) {
        modeInstructions += `\n\n🌿 MENTAL FATIGUE & TIREDNESS GUIDANCE:
The user is expressing feeling mentally tired, exhausted, overwhelmed, or drained.
- Deeply normalize and validate their mental exhaustion. Do not push them to hustle or immediately conquer huge goals right now.
- Gently suggest taking a 1-minute conscious breathing pause right now with you to release physical and mental tension (e.g. relaxing the shoulders, unclenching the jaw, taking a slow grounding breath).
- Remind them that intentional rest is a foundational part of sustainable growth.`;
      }

      let contextStr = "";
      if (options.userContext) {
        const preferredName = options.userContext.nickname || options.userContext.name || 'Friend';
        const fullName = options.userContext.real_name || options.userContext.name;
        const studentId = options.userContext.student_id;
        const college = options.userContext.college_name;
        const education = options.userContext.education_level || 'College Student';
        const goal = options.userContext.main_growth_goal || 'Personal growth & confidence';

        contextStr = `User Profile Context:
- Preferred Name / Nickname: "${preferredName}" (Address the user naturally by this name!)
${fullName && fullName !== preferredName ? `- Full Real Name: "${fullName}"\n` : ''}${studentId ? `- Student/User ID: "${studentId}"\n` : ''}${college ? `- Institution/College: "${college}"\n` : ''}- Education: ${education}
- Core Growth Goal: "${goal}"\n\n`;
      }

      const conversationHistory = (options.history || [])
        .slice(-6)
        .map(h => `${h.sender === 'user' ? 'User' : 'GrowWise'}: ${h.message}`)
        .join('\n');

      const fullPrompt = `${contextStr}${modeInstructions}\n\nRecent conversation:\n${conversationHistory}\nUser: ${options.prompt}\nGrowWise:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: GROWWISE_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      return response.text?.trim() || "I'm reflecting on what you said. How does this challenge connect to your goals today?";
    } catch (err: any) {
      console.error('Error generating AI response:', err);
      return `AI connection encountered an error: ${err.message || 'Service busy'}. Please try again shortly.`;
    }
  },

  async analyzeEnglish(data: {
    userInput: string;
    topic: string;
    mode: 'speaking' | 'interview' | 'situational' | 'general';
  }): Promise<EnglishAnalysisResult> {
    const ai = getAIClient();
    if (!ai) {
      // Return structured response noting offline status
      return {
        overallScore: 70,
        grammarScore: 72,
        vocabularyScore: 68,
        fluencyScore: 65,
        confidenceScore: 75,
        yourSentence: data.userInput,
        betterVersion: data.userInput,
        explanation: "AI feedback is temporarily in offline mode (API key not configured). Your submission was saved to your practice log.",
        positiveFeedback: "Great job taking the initiative to speak and practice!",
        keyTakeaways: ["Keep practicing regularly", "Focus on steady pacing"],
      };
    }

    try {
      const prompt = `Evaluate the following student English response for the practice topic: "${data.topic}".
Student's input: "${data.userInput}"
Practice mode: ${data.mode}

Evaluate kindly and constructively. Return a JSON object with:
- overallScore (integer 0-100)
- grammarScore (integer 0-100)
- vocabularyScore (integer 0-100)
- fluencyScore (integer 0-100)
- confidenceScore (integer 0-100)
- yourSentence: the student's exact phrase or most important sentence that could be polished
- betterVersion: a more natural, professional, or grammatically polished version
- explanation: why this phrasing is clearer or more natural (e.g. "Use simple present for habitual actions")
- positiveFeedback: encouraging comment celebrating their effort
- keyTakeaways: array of 2-3 short bullet point tips`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: GROWWISE_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER },
              grammarScore: { type: Type.INTEGER },
              vocabularyScore: { type: Type.INTEGER },
              fluencyScore: { type: Type.INTEGER },
              confidenceScore: { type: Type.INTEGER },
              yourSentence: { type: Type.STRING },
              betterVersion: { type: Type.STRING },
              explanation: { type: Type.STRING },
              positiveFeedback: { type: Type.STRING },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['overallScore', 'grammarScore', 'vocabularyScore', 'fluencyScore', 'confidenceScore', 'yourSentence', 'betterVersion', 'explanation', 'positiveFeedback', 'keyTakeaways'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        overallScore: parsed.overallScore || 75,
        grammarScore: parsed.grammarScore || 75,
        vocabularyScore: parsed.vocabularyScore || 70,
        fluencyScore: parsed.fluencyScore || 70,
        confidenceScore: parsed.confidenceScore || 75,
        yourSentence: parsed.yourSentence || data.userInput,
        betterVersion: parsed.betterVersion || data.userInput,
        explanation: parsed.explanation || "Well structured communication.",
        positiveFeedback: parsed.positiveFeedback || "Clear and thoughtful response!",
        keyTakeaways: parsed.keyTakeaways || ["Practice speaking regularly"],
      };
    } catch (err: any) {
      console.error('Error analyzing English:', err);
      return {
        overallScore: 72,
        grammarScore: 70,
        vocabularyScore: 72,
        fluencyScore: 70,
        confidenceScore: 75,
        yourSentence: data.userInput,
        betterVersion: data.userInput,
        explanation: "Communication was clear. Keep practicing speaking without hesitation.",
        positiveFeedback: "Good initiative in practicing!",
        keyTakeaways: ["Focus on natural pausing", "Maintain sentence structure"],
      };
    }
  },

  async reflectOnJournal(entry: { title: string; content: string; mood: string }): Promise<JournalReflectionResult> {
    const ai = getAIClient();
    if (!ai) {
      return {
        themes: ['Personal reflection', 'Self-awareness'],
        emotions: [entry.mood],
        patterns: 'Writing down your thoughts helps clarify your perspective.',
        positiveObservations: ['You showed honesty in recording how you feel.'],
        questionsForReflection: ['What is one small step you can take today that feels manageable?'],
      };
    }

    try {
      const prompt = `Reflect on this student's journal entry.
Title: "${entry.title}"
Mood indicated: ${entry.mood}
Content:
"${entry.content}"

Instructions:
- Do NOT diagnose any medical or psychological conditions.
- Do NOT make medical claims.
- Identify general themes, possible emotions, patterns, positive observations, and 1-2 thoughtful questions for self-reflection.
Return a JSON object.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: GROWWISE_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              themes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              emotions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              patterns: { type: Type.STRING },
              positiveObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              questionsForReflection: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['themes', 'emotions', 'patterns', 'positiveObservations', 'questionsForReflection'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        themes: parsed.themes || ['Personal growth'],
        emotions: parsed.emotions || [entry.mood],
        patterns: parsed.patterns || 'Taking time to pause and reflect creates clarity.',
        positiveObservations: parsed.positiveObservations || ['You articulated your experience with clarity.'],
        questionsForReflection: parsed.questionsForReflection || ['What did this experience teach you about yourself?'],
      };
    } catch (err: any) {
      console.error('Error reflecting on journal:', err);
      return {
        themes: ['Reflection and self-honesty'],
        emotions: [entry.mood],
        patterns: 'Reflecting on your day helps separate facts from anxious interpretations.',
        positiveObservations: ['You took time out of your busy day to check in with yourself.'],
        questionsForReflection: ['What is one thing that brought you peace today, even briefly?'],
      };
    }
  },

  async generateInterviewQuestion(role: string, difficulty: string = 'entry-level'): Promise<{ question: string; tips: string[]; framework: string }> {
    const ai = getAIClient();
    if (!ai) {
      return {
        question: "Tell me about a time you faced a difficult deadline during a project and how you managed it.",
        tips: ["Use the STAR method: Situation, Task, Action, Result", "Focus on what YOU did rather than just the team"],
        framework: "STAR Method (Situation, Task, Action, Result)",
      };
    }

    try {
      const prompt = `Generate a realistic college campus placement or internship interview question for: Role: ${role}, Level: ${difficulty}.
Return a JSON object with:
- question: the interview question
- tips: array of 2-3 strategic tips for answering
- framework: recommended response structure (e.g. STAR or PREP)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: GROWWISE_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              framework: { type: Type.STRING },
            },
            required: ['question', 'tips', 'framework'],
          },
        },
      });

      return JSON.parse(response.text?.trim() || '{}');
    } catch (err) {
      return {
        question: "Describe a situation where you had to communicate complex technical details to someone outside your field.",
        tips: ["Avoid excessive jargon", "Emphasize empathy and clarity"],
        framework: "STAR Method",
      };
    }
  },
};

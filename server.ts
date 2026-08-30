import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Body Parsers (Ordering guarantee)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${req.method}] ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

/**
 * Deeply strips undefined values and sanitizes payloads
 */
export function cleanPayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanPayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanPayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

// Resilient Gemini Model Fallback Ladder (Primary: gemini-3.6-flash)
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

interface GenerateOptions {
  contents: unknown;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
}

interface FallbackResult {
  text: string;
  modelUsed: string;
  attempts: Array<{ model: string; status: 'success' | 'failed'; error?: string; durationMs: number }>;
}

async function generateWithFallbackLadder(options: GenerateOptions): Promise<FallbackResult> {
  const client = getGeminiClient();
  const attempts: FallbackResult['attempts'] = [];

  for (const model of MODEL_FALLBACK_LADDER) {
    const start = Date.now();
    try {
      console.log(`[Gemini Fallback] Calling model: ${model}`);
      const response = await client.models.generateContent({
        model,
        contents: options.contents as string,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
          ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
          ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
        },
      });

      const durationMs = Date.now() - start;
      const text = response.text || '';
      attempts.push({ model, status: 'success', durationMs });
      console.log(`[Gemini Fallback] Succeeded with model ${model} in ${durationMs}ms`);

      return {
        text,
        modelUsed: model,
        attempts,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Fallback] Model ${model} failed (${durationMs}ms): ${errorMessage}`);
      attempts.push({ model, status: 'failed', error: errorMessage, durationMs });

      if (model === MODEL_FALLBACK_LADDER[MODEL_FALLBACK_LADDER.length - 1]) {
        throw new Error(`All models in fallback ladder failed. Last error: ${errorMessage}`);
      }
    }
  }

  throw new Error('Exhausted all models in fallback ladder');
}

// ==========================================
// REST API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    modelFallbackLadder: MODEL_FALLBACK_LADDER,
    features: {
      auth: 'Firebase Auth (Google Sign-In)',
      database: 'Cloud Firestore (User-Isolated Document Storage)',
      ai: 'Gemini 3.6 Flash (Multi-Turn Reflection & Summarization)',
    },
  });
});

// 1. Multi-Turn Reflective Dialogue
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(rawBody.messages) ? rawBody.messages : [];
    const entryContext = rawBody.entryContext || {};
    const title = sanitizeString(entryContext.title) || 'Personal Reflection';
    const category = sanitizeString(entryContext.category) || 'Personal Reflection';
    const mood = sanitizeString(entryContext.mood) || 'Thoughtful';

    if (messages.length === 0) {
      res.status(400).json({ error: 'Messages array must not be empty' });
      return;
    }

    const systemInstruction = `You are ReflectAI, an empathetic, intellectually rigorous, and supportive reflection companion and journal guide.
Your purpose is to help the user unpack their thoughts, gain clarity, challenge unhelpful cognitive distortions, explore new angles, and discover actionable wisdom.

Context of this journal session:
- Title: "${title}"
- Category: "${category}"
- Current Mood: "${mood}"

Guidelines for your responses:
1. Acknowledge and validate the user's emotional and intellectual reality warmly without hollow clichés.
2. Provide a thoughtful, structured reflection that identifies underlying themes, mental models, or hidden strengths.
3. If appropriate, offer 2-3 creative perspectives, philosophical reframes, or brainstorming angles.
4. End with 2 gentle, thought-provoking follow-up prompts/questions that encourage the user to explore deeper or take a constructive micro-step.
5. Use clear, elegant Markdown formatting with subheadings, bold highlights, or bullet points where helpful.`;

    // Construct conversation history prompt
    const formattedDialogue = messages
      .map((m: { role: string; content: string }) => {
        const speaker = m.role === 'user' ? 'USER JOURNAL ENTRY' : 'REFLECTAI COMPANION';
        return `[${speaker}]:\n${m.content}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Here is the multi-turn journal reflection conversation so far:\n\n${formattedDialogue}\n\nRespond to the user's latest thought as their dedicated ReflectAI companion:`;

    const result = await generateWithFallbackLadder({
      contents: prompt,
      systemInstruction,
      temperature: 0.7,
    });

    res.json(
      cleanPayload({
        success: true,
        reply: result.text,
        modelUsed: result.modelUsed,
        attempts: result.attempts,
      })
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Gemini reflect error:', err);
    res.status(500).json({ error: err });
  }
});

// 2. Structured Session Summarization & Synthesis
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(rawBody.messages) ? rawBody.messages : [];
    const entryContext = rawBody.entryContext || {};
    const title = sanitizeString(entryContext.title) || 'Journal Session';

    if (messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required for summary' });
      return;
    }

    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const systemInstruction = `You are an expert executive coach and cognitive analyst.
Analyze the provided journal reflection session and generate a structured executive synthesis.

Return ONLY a valid JSON object matching this structure:
{
  "summary": "A concise 2-3 sentence executive synthesis of the reflection session.",
  "keyInsights": [
    "Key psychological, strategic, or personal insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "actionItems": [
    "Concrete, immediate action item or cognitive commitment 1",
    "Concrete action item 2"
  ],
  "detectedMood": "Calm | Energized | Focused | Thoughtful | Anxious | Inspired | Grateful | Motivated",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "encouragement": "A short, grounded one-sentence closing affirmation."
}`;

    const prompt = `Journal Title: "${title}"\n\nFull Conversation:\n${conversationText}\n\nProvide the structured JSON synthesis.`;

    const result = await generateWithFallbackLadder({
      contents: prompt,
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    let analysis = null;
    try {
      analysis = JSON.parse(result.text);
    } catch {
      analysis = {
        summary: result.text,
        keyInsights: [],
        actionItems: [],
        suggestedTags: [],
        detectedMood: 'Thoughtful',
      };
    }

    res.json(
      cleanPayload({
        success: true,
        analysis,
        modelUsed: result.modelUsed,
      })
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Gemini summarize error:', err);
    res.status(500).json({ error: err });
  }
});

// 3. Brainstorming Accelerator
app.post('/api/gemini/brainstorm', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body && typeof req.body === 'object' ? req.body : {};
    const topic = sanitizeString(rawBody.topic);
    const category = sanitizeString(rawBody.category) || 'Brainstorming & Ideas';

    if (!topic) {
      res.status(400).json({ error: 'topic is required' });
      return;
    }

    const systemInstruction = `You are a high-velocity creative strategist and lateral thinking partner.
Generate 5 diverse, unconventional, high-leverage brainstorming angles, ideas, or experiments for the user's reflection topic.

Return ONLY a valid JSON object:
{
  "angles": [
    {
      "title": "Angle Name",
      "concept": "Explanation of this creative approach or paradigm shift",
      "firstStep": "Immediate small experiment to test it"
    }
  ],
  "provocativeQuestion": "One paradigm-challenging question to unlock breakthroughs"
}`;

    const prompt = `Category: ${category}\nTopic / Challenge:\n${topic}\n\nGenerate creative brainstorming angles in JSON.`;

    const result = await generateWithFallbackLadder({
      contents: prompt,
      systemInstruction,
      temperature: 0.8,
      responseMimeType: 'application/json',
    });

    let data = null;
    try {
      data = JSON.parse(result.text);
    } catch {
      data = { raw: result.text };
    }

    res.json(
      cleanPayload({
        success: true,
        data,
        modelUsed: result.modelUsed,
      })
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Gemini brainstorm error:', err);
    res.status(500).json({ error: err });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ReflectAI Server] running on http://0.0.0.0:${PORT}`);
    console.log(`[Gemini Fallback Ladder] Configured: ${MODEL_FALLBACK_LADDER.join(' -> ')}`);
  });
}

startServer();

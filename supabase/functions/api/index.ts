// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Basic router for /api/* endpoints

const baseHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { ...baseHeaders, ...(init.headers || {}) },
    status: init.status || 200,
  });

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const apiKey = serviceKey || anonKey || "";

const restUrl = supabaseUrl ? `${supabaseUrl}/rest/v1` : "";

async function rest(path: string, init: RequestInit & { method?: string } = {}) {
  if (!restUrl || !apiKey) {
    throw new Error("Supabase env not configured");
  }
  const url = `${restUrl}${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("apikey", apiKey);
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${errText}`);
  }
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text as unknown as any;
  }
}

function parseJson<T>(req: Request): Promise<T> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return req.json();
  return Promise.resolve({} as T);
}

function safeParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: baseHeaders, status: 204 });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/functions\/v1/, "");

    // Health
    if (req.method === "GET" && path === "/api/health") {
      return json({ status: "ok" });
    }

    // Quizzes list/create
    if (path === "/api/quizzes") {
      if (req.method === "GET") {
        const quizzes = await rest(`/quizzes?select=*`);
        for (const quiz of quizzes) {
          const questions = await rest(`/questions?select=*&quiz_id=eq.${quiz.id}`);
          quiz.questions = questions.map((q: any) => ({
            ...q,
            options: safeParse<string[]>(q.options, []),
          }));
        }
        return json(quizzes);
      }
      if (req.method === "POST") {
        const body = await parseJson<any>(req);
        if (!body.title || !body.timePerQuestion) {
          return json({ error: "Title and time per question are required" }, { status: 400 });
        }
        const newQuiz = {
          id: crypto.randomUUID(),
          title: body.title,
          description: body.description || "",
          time_per_question: Number(body.timePerQuestion),
          is_active: false,
          created_at: new Date().toISOString(),
        };
        await rest(`/quizzes`, { method: "POST", body: JSON.stringify(newQuiz) });
        return json({
          id: newQuiz.id,
          title: newQuiz.title,
          description: newQuiz.description,
          timePerQuestion: newQuiz.time_per_question,
          isActive: newQuiz.is_active,
          createdAt: newQuiz.created_at,
          questions: [],
        }, { status: 201 });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // Quiz update/delete
    const quizIdMatch = path.match(/^\/api\/quizzes\/([^\/]+)$/);
    if (quizIdMatch) {
      const quizId = quizIdMatch[1];
      if (req.method === "PUT") {
        const body = await parseJson<any>(req);
        const updates: Record<string, unknown> = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.timePerQuestion !== undefined) updates.time_per_question = Number(body.timePerQuestion);
        if (Object.keys(updates).length === 0) return json({ error: "No updates" }, { status: 400 });
        await rest(`/quizzes?id=eq.${quizId}`, { method: "PATCH", body: JSON.stringify(updates) });
        const quiz = await rest(`/quizzes?id=eq.${quizId}&select=*`);
        if (!quiz?.[0]) return json({ error: "Quiz not found" }, { status: 404 });
        const questions = await rest(`/questions?select=*&quiz_id=eq.${quizId}`);
        const updated = quiz[0];
        updated.questions = questions.map((q: any) => ({ ...q, options: safeParse<string[]>(q.options, []) }));
        return json(updated);
      }
      if (req.method === "DELETE") {
        await rest(`/quizzes?id=eq.${quizId}`, { method: "DELETE" });
        return json({ message: "Quiz deleted successfully" });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // Questions add/update/delete
    const questionsCreateMatch = path.match(/^\/api\/quizzes\/([^\/]+)\/questions$/);
    if (questionsCreateMatch) {
      const quizId = questionsCreateMatch[1];
      if (req.method === "POST") {
        const body = await parseJson<any>(req);
        const newQuestion = {
          id: crypto.randomUUID(),
          quiz_id: quizId,
          question: body.question,
          options: JSON.stringify(body.options || []),
          correct_answer: body.correctAnswer,
          category: body.category || null,
          difficulty: body.difficulty || null,
          points: body.points ?? 10,
        };
        await rest(`/questions`, { method: "POST", body: JSON.stringify(newQuestion) });
        return json({ id: newQuestion.id, ...body }, { status: 201 });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    const questionDetailMatch = path.match(/^\/api\/quizzes\/([^\/]+)\/questions\/([^\/]+)$/);
    if (questionDetailMatch) {
      const questionId = questionDetailMatch[2];
      if (req.method === "PUT") {
        const body = await parseJson<any>(req);
        const updates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(body)) {
          if (key === "options") updates.options = JSON.stringify(value);
          else if (key === "correctAnswer") updates.correct_answer = value;
          else updates[key] = value as unknown;
        }
        await rest(`/questions?id=eq.${questionId}`, { method: "PATCH", body: JSON.stringify(updates) });
        return json({ id: questionId, ...body });
      }
      if (req.method === "DELETE") {
        await rest(`/questions?id=eq.${questionId}`, { method: "DELETE" });
        return json({ message: "Question deleted successfully" });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // Sessions list
    if (path === "/api/session" && req.method === "GET") {
      const sessions = await rest(`/sessions?select=*&order=started_at.desc`);
      const mapped = (sessions || []).map((s: any) => ({
        id: s.id,
        quizId: s.quiz_id,
        isActive: !!s.is_active,
        startedAt: s.started_at,
        endedAt: s.ended_at,
      }));
      return json(mapped);
    }

    // Sessions active
    if (path === "/api/sessions/active" && req.method === "GET") {
      const active = await rest(`/sessions?select=*&is_active=eq.true`);
      const mapped = (active || []).map((s: any) => ({
        id: s.id,
        quizId: s.quiz_id,
        isActive: !!s.is_active,
        startedAt: s.started_at,
        endedAt: s.ended_at,
      }));
      return json(mapped);
    }

    // Session start
    if (path === "/api/session/start" && req.method === "POST") {
      const body = await parseJson<{ quizId: string }>(req);
      if (!body.quizId) return json({ error: "Quiz ID is required" }, { status: 400 });
      const quiz = await rest(`/quizzes?id=eq.${body.quizId}&select=*`);
      if (!quiz?.[0]) return json({ error: "Quiz not found" }, { status: 404 });
      // Existing active session
      const existing = await rest(`/sessions?quiz_id=eq.${body.quizId}&is_active=eq.true`);
      if (existing?.[0]) return json(existing[0]);
      const session = {
        id: crypto.randomUUID(),
        quiz_id: body.quizId,
        is_active: true,
        started_at: new Date().toISOString(),
        ended_at: null,
      };
      await rest(`/sessions`, { method: "POST", body: JSON.stringify(session) });
      return json({ id: session.id, quizId: session.quiz_id, isActive: true, startedAt: session.started_at, endedAt: null });
    }

    // Session stop
    if (path === "/api/session/stop" && req.method === "POST") {
      const body = await parseJson<{ quizId: string }>(req);
      if (!body.quizId) return json({ error: "Quiz ID is required" }, { status: 400 });
      await rest(`/sessions?quiz_id=eq.${body.quizId}&is_active=eq.true`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false, ended_at: new Date().toISOString() }),
      });
      return json({ message: "Session stopped" });
    }

    // Session stop all
    if (path === "/api/session/stop-all" && req.method === "POST") {
      await rest(`/sessions?is_active=eq.true`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false, ended_at: new Date().toISOString() }),
      });
      return json({ message: "All sessions stopped" });
    }

    // Users register
    if (path === "/api/users/register" && req.method === "POST") {
      const body = await parseJson<any>(req);
      if (!body.name) return json({ error: "Name is required" }, { status: 400 });
      const existing = await rest(`/users?select=*&name=eq.${encodeURIComponent(body.name)}`);
      if (existing?.[0]) return json({
        id: existing[0].id,
        name: existing[0].name,
        linkedinProfile: existing[0].linkedin_profile || "",
        email: existing[0].email || undefined,
        phone: existing[0].phone || undefined,
        registeredAt: existing[0].registered_at,
      });
      const user = {
        id: crypto.randomUUID(),
        name: body.name,
        linkedin_profile: body.linkedinProfile || "",
        email: body.email || null,
        phone: body.phone || null,
        registered_at: new Date().toISOString(),
      };
      await rest(`/users`, { method: "POST", body: JSON.stringify(user) });
      return json({ id: user.id, name: user.name, linkedinProfile: user.linkedin_profile, email: user.email || undefined, phone: user.phone || undefined, registeredAt: user.registered_at }, { status: 201 });
    }

    // Results list/create/reset
    if (path === "/api/results") {
      if (req.method === "GET") {
        const results = await rest(`/results?select=*&order=completed_at.desc`);
        const mapped = (results || []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          quizId: r.quiz_id,
          playerName: r.player_name,
          score: Number(r.score),
          totalQuestions: Number(r.total_questions),
          timeSpent: Number(r.time_spent),
          answers: safeParse<any[]>(r.answers, []),
          completedAt: r.completed_at,
        }));
        return json(mapped);
      }
      if (req.method === "POST") {
        const body = await parseJson<any>(req);
        const user = await rest(`/users?id=eq.${body.userId}`);
        if (!user?.[0]) return json({ error: "User not found" }, { status: 404 });
        const attempt = await rest(`/results?user_id=eq.${body.userId}&quiz_id=eq.${body.quizId}`);
        if (attempt?.[0]) return json({ error: "User has already attempted this quiz" }, { status: 400 });
        const active = await rest(`/sessions?quiz_id=eq.${body.quizId}&is_active=eq.true`);
        if (!active?.[0]) return json({ error: "Quiz session has ended or is not active" }, { status: 400 });
        const result = {
          id: crypto.randomUUID(),
          user_id: body.userId,
          quiz_id: body.quizId,
          player_name: user[0].name,
          score: body.score,
          total_questions: body.totalQuestions,
          time_spent: body.timeSpent,
          answers: JSON.stringify(body.answers || []),
          completed_at: new Date().toISOString(),
        };
        await rest(`/results`, { method: "POST", body: JSON.stringify(result) });
        return json({
          id: result.id,
          userId: result.user_id,
          quizId: result.quiz_id,
          playerName: result.player_name,
          score: result.score,
          totalQuestions: result.total_questions,
          timeSpent: result.time_spent,
          answers: body.answers || [],
          completedAt: result.completed_at,
        }, { status: 201 });
      }
      if (req.method === "DELETE") {
        await rest(`/results`, { method: "DELETE" });
        return json({ message: "All leaderboards reset successfully" });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // Results by quiz id
    const resultsByQuiz = path.match(/^\/api\/results\/([^\/]+)$/);
    if (resultsByQuiz) {
      const quizId = resultsByQuiz[1];
      if (req.method === "GET") {
        const list = await rest(`/results?select=*&quiz_id=eq.${quizId}&order=score.desc,time_spent.asc`);
        const mapped = (list || []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          quizId: r.quiz_id,
          playerName: r.player_name,
          score: Number(r.score),
          totalQuestions: Number(r.total_questions),
          timeSpent: Number(r.time_spent),
          answers: safeParse<any[]>(r.answers, []),
          completedAt: r.completed_at,
        }));
        return json(mapped);
      }
      if (req.method === "DELETE") {
        await rest(`/results?quiz_id=eq.${quizId}`, { method: "DELETE" });
        return json({ message: "Quiz-specific leaderboard reset successfully" });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // User attempts
    const attemptMatch = path.match(/^\/api\/user\/([^\/]+)\/attempts\/([^\/]+)$/);
    if (attemptMatch && req.method === "GET") {
      const userId = attemptMatch[1];
      const quizId = attemptMatch[2];
      const attempt = await rest(`/results?select=*&user_id=eq.${userId}&quiz_id=eq.${quizId}`);
      const item = attempt?.[0] ? { ...attempt[0], answers: safeParse<any[]>(attempt[0].answers, []) } : null;
      return json({ hasAttempted: !!item, attempt: item });
    }

    // Active quizzes list
    if (path === "/api/quiz/active" && req.method === "GET") {
      const activeSessions = await rest(`/sessions?select=*&is_active=eq.true`);
      if (!activeSessions?.length) return json({ error: "No active quiz sessions" }, { status: 404 });
      const activeQuizzes: any[] = [];
      for (const session of activeSessions) {
        const quiz = await rest(`/quizzes?id=eq.${session.quiz_id}&select=*`);
        if (quiz?.[0]) activeQuizzes.push({ ...quiz[0], sessionId: session.id });
      }
      if (!activeQuizzes.length) return json({ error: "Active quiz not found" }, { status: 404 });
      // Attach questions to each quiz
      for (const quiz of activeQuizzes) {
        const questions = await rest(`/questions?select=*&quiz_id=eq.${quiz.id}`);
        quiz.questions = questions.map((q: any) => ({ ...q, options: safeParse<any[]>(q.options, []) }));
      }
      return json(activeQuizzes);
    }

    // Active quiz by id
    const activeById = path.match(/^\/api\/quiz\/active\/([^\/]+)$/);
    if (activeById && req.method === "GET") {
      const quizId = activeById[1];
      const session = await rest(`/sessions?quiz_id=eq.${quizId}&is_active=eq.true`);
      if (!session?.[0]) return json({ error: "No active session for this quiz" }, { status: 404 });
      const quiz = await rest(`/quizzes?id=eq.${quizId}&select=*`);
      if (!quiz?.[0]) return json({ error: "Quiz not found" }, { status: 404 });
      const questions = await rest(`/questions?select=*&quiz_id=eq.${quizId}`);
      const full = { ...quiz[0], sessionId: session[0].id } as any;
      full.questions = questions.map((q: any) => ({ ...q, options: safeParse<any[]>(q.options, []) }));
      return json(full);
    }

    return json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error(error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
});

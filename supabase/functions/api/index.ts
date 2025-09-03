// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Declare Deno for editor/linter awareness (runtime provides it)
// deno-lint-ignore no-explicit-any
declare const Deno: any;

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

// Access env safely (Deno provided at runtime)
// deno-lint-ignore no-explicit-any
const getenv = (key: string): string | undefined => (globalThis as any).Deno?.env?.get?.(key);
const supabaseUrl = getenv("SUPABASE_URL");
const serviceKey = getenv("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = getenv("PROJECT_SECRET_KEY");
const apiKey = serviceKey || anonKey || "";

const restUrl = supabaseUrl ? `${supabaseUrl}/rest/v1` : "";

// JWT secret for token generation
const JWT_SECRET = getenv("JWT_SECRET") || "your-jwt-secret-key-change-in-production";

// Crypto utilities
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

function generateJWT(userId: string, expiresIn: number = 24 * 60 * 60 * 1000): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    userId,
    exp: Math.floor((Date.now() + expiresIn) / 1000),
    iat: Math.floor(Date.now() / 1000)
  };
  
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const signature = btoa(`${headerB64}.${payloadB64}.${JWT_SECRET}`); // Simplified for demo
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

function verifyJWT(token: string): { userId: string } | null {
  try {
    const [headerB64, payloadB64, signature] = token.split(".");
    const expectedSig = btoa(`${headerB64}.${payloadB64}.${JWT_SECRET}`);
    
    if (signature !== expectedSig) return null;
    
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

async function authenticateRequest(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.slice(7);
  return verifyJWT(token);
}

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

async function fetchUser(userId: string) {
  const list = await rest(`/users?select=*&id=eq.${userId}`);
  return list?.[0] || null;
}

async function fetchQuizRaw(quizId: string) {
  const list = await rest(`/quizzes?select=*&id=eq.${quizId}`);
  return list?.[0] || null;
}

function mapQuestion(q: any) {
  return {
    id: q.id,
    question: q.question,
    options: safeParse<string[]>(q.options, []),
    correctAnswer: q.correct_answer,
    category: q.category || "",
    difficulty: q.difficulty,
    positivePoints: Number(q.positive_points || 10),
    negativePoints: Number(q.negative_points || 0),
    time: Number(q.time),
    quizIds: q.quiz_ids || [],
  };
}

async function fetchQuestionsForQuiz(quizId: string) {
  const all = await rest(`/questions?select=*`);
  const filtered = (all || []).filter((q: any) => Array.isArray(q.quiz_ids) ? q.quiz_ids.includes(quizId) : false);
  return filtered.map(mapQuestion);
}

function mapQuiz(quiz: any, questions: any[] = []) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description || "",
    status: quiz.status,
    totalTime: Number(quiz.total_time || 0),
    totalQuestions: Number(quiz.total_questions || 0),
    createdAt: quiz.created_at,
    questions,
  };
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

    // Admin: whoami
    if (path === "/api/admin/me" && req.method === "GET") {
      const auth = await authenticateRequest(req);
      if (!auth) return json({ error: "Authentication required" }, { status: 401 });
      const user = await rest(`/users?select=*&id=eq.${auth.userId}`);
      const u = user?.[0];
      if (!u) return json({ error: "User not found" }, { status: 404 });
      const adminEmail = (getenv("ADMIN_EMAIL") || "admin@quiz.local").toLowerCase();
      const adminPhone = getenv("ADMIN_PHONE") || "+10000000000";
      const isAdmin = !!u.is_admin || (u.email && u.email.toLowerCase() === adminEmail) || (u.phone && u.phone === adminPhone);
      return json({
        isAdmin,
        user: {
          id: u.id,
          name: u.name,
          linkedinProfile: u.linkedin_profile || "",
          email: u.email || undefined,
          phone: u.phone || undefined,
          registeredAt: u.registered_at,
        },
      });
    }

    // Admin: seed a default admin (idempotent)
    if (path === "/api/admin/seed" && req.method === "POST") {
      // Optional basic protection via header token
      const seedToken = req.headers.get("x-seed-token");
      const allowed = Deno.env.get("ADMIN_SEED_TOKEN");
      if (allowed && seedToken !== allowed) {
        return json({ error: "Forbidden" }, { status: 403 });
      }

      const body = await parseJson<any>(req);
      const name = (body.name || "Administrator").toString();
      const email = (body.email || getenv("ADMIN_EMAIL") || "admin@quiz.local").toString().toLowerCase();
      const phone = (body.phone || getenv("ADMIN_PHONE") || "+10000000000").toString();
      const password = (body.password || getenv("ADMIN_PASSWORD") || "Admin@12345").toString();

      // If an admin already exists (by email or phone), return it
      const matches = await rest(`/users?select=*&or=(email.eq.${encodeURIComponent(email)},phone.eq.${encodeURIComponent(phone)})&order=registered_at.asc`);
      const existing = matches?.[0];
      if (existing) {
        const token = generateJWT(existing.id);
        try {
          await rest(`/auth_sessions`, { method: "POST", body: JSON.stringify({
            id: crypto.randomUUID(),
            user_id: existing.id,
            token_hash: await hashPassword(token),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }) });
        } catch {}
        return json({
          message: "Admin already exists",
          admin: {
            id: existing.id,
            name: existing.name,
            email: existing.email || undefined,
            phone: existing.phone || undefined,
            isAdmin: true,
            token,
          },
        }, { status: 200 });
      }

      const id = crypto.randomUUID();
      const passwordHash = await hashPassword(password);
      const user = {
        id,
        name,
        linkedin_profile: null, // Always null for admin to avoid unique constraint issues
        email,
        phone,
        password_hash: passwordHash,
        is_password_set: true,
        registered_at: new Date().toISOString(),
      } as Record<string, unknown>;
      try {
        // Try to mark admin if column exists
        user["is_admin"] = true;
        await rest(`/users`, { method: "POST", body: JSON.stringify(user) });
      } catch (e) {
        // Fallback without is_admin
        delete user["is_admin"];
        await rest(`/users`, { method: "POST", body: JSON.stringify(user) });
      }

      // Issue a token for convenience
      const token = generateJWT(id);
      try {
        await rest(`/auth_sessions`, { method: "POST", body: JSON.stringify({
          id: crypto.randomUUID(),
          user_id: id,
          token_hash: await hashPassword(token),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }) });
      } catch {}

      return json({
        message: "Admin created",
        admin: {
          id,
          name,
          email,
          phone,
          isAdmin: true,
          token,
          password,
        },
      }, { status: 201 });
    }

    // Users register - only create new users, return 409 if exists
    if (path === "/api/users/register" && req.method === "POST") {
      const body = await parseJson<any>(req);

      // Basic validation: name and phone are mandatory
      const name = (body.name || "").toString().trim();
      const phone = (body.phone || "").toString().trim();
      const email = (body.email || "").toString().trim();
      const linkedinProfile = (body.linkedinProfile || "").toString().trim();

      if (!name) return json({ error: "Name is required" }, { status: 400 });
      if (!phone) return json({ error: "Phone is required" }, { status: 400 });

      // Lightweight format checks
      const phoneDigits = phone.replace(/[^0-9+]/g, "");
      if (phoneDigits.length < 8) {
        return json({ error: "Invalid phone number" }, { status: 400 });
      }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return json({ error: "Invalid email format" }, { status: 400 });
      }

      // Check if user already exists by phone (primary identifier)
      const byPhone = await rest(`/users?select=*&phone=eq.${encodeURIComponent(phoneDigits)}`);
      if (byPhone?.[0]) {
        return json({ error: "User already exists. Please login instead." }, { status: 409 });
      }

      // Check email uniqueness
      if (email) {
        const byEmail = await rest(`/users?select=*&email=eq.${encodeURIComponent(email)}`);
        if (byEmail?.[0]) {
          return json({ error: "Email already registered" }, { status: 409 });
        }
      }

      // Check LinkedIn uniqueness (only if not empty)
      if (linkedinProfile && linkedinProfile.trim()) {
        const byLinkedin = await rest(`/users?select=*&linkedin_profile=eq.${encodeURIComponent(linkedinProfile)}`);
        if (byLinkedin?.[0]) {
          return json({ error: "LinkedIn profile already registered" }, { status: 409 });
        }
      }

      // Create new user without password (password will be set later)
      const user = {
        id: crypto.randomUUID(),
        name,
        linkedin_profile: (linkedinProfile && linkedinProfile.trim()) ? linkedinProfile.trim() : null,
        email: email || null,
        phone: phoneDigits,
        password_hash: null,
        is_password_set: false,
        registered_at: new Date().toISOString(),
      };
      
      try {
        await rest(`/users`, { method: "POST", body: JSON.stringify(user) });
      } catch (e: any) {
        return json({ error: "DB insert failed", details: String(e?.message || e) }, { status: 500 });
      }
      
      return json({ 
        id: user.id, 
        name: user.name, 
        linkedinProfile: user.linkedin_profile || "", 
        email: user.email || undefined, 
        phone: user.phone || undefined, 
        registeredAt: user.registered_at,
        isPasswordSet: false
      }, { status: 201 });
    }

    // Set password for new users
    if (path === "/api/users/set-password" && req.method === "POST") {
      const body = await parseJson<{ userId: string; password: string }>(req);
      
      if (!body.userId || !body.password) {
        return json({ error: "User ID and password are required" }, { status: 400 });
      }
      
      if (body.password.length < 6) {
        return json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      // Get user and verify they haven't set password yet
      const users = await rest(`/users?select=*&id=eq.${body.userId}`);
      const user = users?.[0];
      
      if (!user) {
        return json({ error: "User not found" }, { status: 404 });
      }
      
      if (user.is_password_set) {
        return json({ error: "Password already set. Please use login." }, { status: 400 });
      }

      // Hash password and update user
      const passwordHash = await hashPassword(body.password);
      await rest(`/users?id=eq.${body.userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          password_hash: passwordHash,
          is_password_set: true
        })
      });

      // Generate JWT token
      const token = generateJWT(user.id);
      
      // Store session
      const session = {
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: await hashPassword(token),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      await rest(`/auth_sessions`, { method: "POST", body: JSON.stringify(session) });

      return json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          linkedinProfile: user.linkedin_profile || "",
          email: user.email || undefined,
          phone: user.phone || undefined,
          registeredAt: user.registered_at
        }
      });
    }

    // Login endpoint
    if (path === "/api/users/login" && req.method === "POST") {
      const body = await parseJson<{ phone: string; password: string }>(req);
      
      if (!body.phone || !body.password) {
        return json({ error: "Phone and password are required" }, { status: 400 });
      }

      const phoneDigits = body.phone.replace(/[^0-9+]/g, "");
      
      // Get user by phone
      const users = await rest(`/users?select=*&phone=eq.${encodeURIComponent(phoneDigits)}`);
      const user = users?.[0];
      
      if (!user || !user.is_password_set) {
        return json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Verify password
      const isValid = await verifyPassword(body.password, user.password_hash);
      if (!isValid) {
        return json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Update last login
      await rest(`/users?id=eq.${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ last_login: new Date().toISOString() })
      });

      // Generate JWT token
      const token = generateJWT(user.id);
      
      // Store session
      const session = {
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: await hashPassword(token),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      await rest(`/auth_sessions`, { method: "POST", body: JSON.stringify(session) });

      return json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          linkedinProfile: user.linkedin_profile || "",
          email: user.email || undefined,
          phone: user.phone || undefined,
          registeredAt: user.registered_at
        }
      });
    }

    // Questions - bank
    if (path === "/api/questions") {
      if (req.method === "GET") {
        const list = await rest(`/questions?select=*`);
        const mapped = (list || []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: safeParse<string[]>(q.options, []),
          correctAnswer: q.correct_answer,
          category: q.category || "",
          difficulty: q.difficulty,
          positivePoints: Number(q.positive_points || 10),
          negativePoints: Number(q.negative_points || 0),
          time: Number(q.time),
          quizIds: Array.isArray(q.quiz_ids) ? q.quiz_ids : [],
        }));
        return json(mapped);
      }
      if (req.method === "POST") {
        const body = await parseJson<any>(req);
                 const newQ = {
           id: crypto.randomUUID(),
           question: body.question,
           options: JSON.stringify(body.options || []),
           correct_answer: body.correctAnswer,
           category: body.category || null,
           difficulty: body.difficulty || 'easy',
           positive_points: body.positivePoints ?? 10,
           negative_points: body.negativePoints ?? 0,
           time: body.time ?? 30,
           quiz_ids: Array.isArray(body.quizIds) ? body.quizIds : [],
         };
        await rest(`/questions`, { method: "POST", body: JSON.stringify(newQ) });
        // Recalculate stats for any affected quizzes
        for (const qid of newQ.quiz_ids) {
          await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: qid }) });
        }
        return json({ id: newQ.id, ...body }, { status: 201 });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    const questionDetail = path.match(/^\/api\/questions\/([^\/]+)$/);
    if (questionDetail) {
      const qid = questionDetail[1];
      if (req.method === "PUT") {
        const body = await parseJson<any>(req);
        const updates: Record<string, unknown> = {};
        if (body.question !== undefined) updates.question = body.question;
        if (body.options !== undefined) updates.options = JSON.stringify(body.options);
        if (body.correctAnswer !== undefined) updates.correct_answer = body.correctAnswer;
                 if (body.category !== undefined) updates.category = body.category;
         if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
         if (body.positivePoints !== undefined) updates.positive_points = body.positivePoints;
         if (body.negativePoints !== undefined) updates.negative_points = body.negativePoints;
         if (body.time !== undefined) updates.time = body.time;
        if (body.quizIds !== undefined) updates.quiz_ids = body.quizIds;
        await rest(`/questions?id=eq.${qid}`, { method: "PATCH", body: JSON.stringify(updates) });
        // Recalc for affected quizzes
        if (Array.isArray(body.quizIds)) {
          for (const qz of body.quizIds) {
            await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: qz }) });
          }
        }
        return json({ id: qid, ...body });
      }
      if (req.method === "DELETE") {
        // Before delete, get old quiz_ids
        const existing = await rest(`/questions?select=*&id=eq.${qid}`);
        const old = existing?.[0];
        await rest(`/questions?id=eq.${qid}`, { method: "DELETE" });
        if (old?.quiz_ids) {
          for (const qz of old.quiz_ids) {
            await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: qz }) });
          }
        }
        return json({ message: "Question deleted" });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // Quizzes list/create
    if (path === "/api/quizzes") {
      if (req.method === "GET") {
        const quizzes = await rest(`/quizzes?select=*`);
        const mapped: any[] = [];
        for (const quiz of quizzes || []) {
          const questions = await fetchQuestionsForQuiz(quiz.id);
          mapped.push(mapQuiz(quiz, questions));
        }
        return json(mapped);
      }
      if (req.method === "POST") {
        const body = await parseJson<any>(req);
        if (!body.title) {
          return json({ error: "Title is required" }, { status: 400 });
        }
        const newQuiz = {
          id: crypto.randomUUID(),
          title: body.title,
          description: body.description || "",
          status: 'inactive',
          total_time: 0,
          total_questions: 0,
          created_at: new Date().toISOString(),
        };
        await rest(`/quizzes`, { method: "POST", body: JSON.stringify(newQuiz) });
        // Optionally attach initial questions
        if (Array.isArray(body.questionIds) && body.questionIds.length) {
          for (const qid of body.questionIds) {
            const q = await rest(`/questions?select=*&id=eq.${qid}`);
            const question = q?.[0];
            if (question) {
              const updated = Array.isArray(question.quiz_ids) ? Array.from(new Set([...question.quiz_ids, newQuiz.id])) : [newQuiz.id];
              await rest(`/questions?id=eq.${qid}`, { method: "PATCH", body: JSON.stringify({ quiz_ids: updated }) });
            }
          }
          // Recalc aggregates
          await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: newQuiz.id }) });
        }
        return json(mapQuiz(newQuiz, []), { status: 201 });
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
        if (body.status !== undefined) updates.status = body.status;
        if (Object.keys(updates).length === 0) return json({ error: "No updates" }, { status: 400 });
        await rest(`/quizzes?id=eq.${quizId}`, { method: "PATCH", body: JSON.stringify(updates) });
        const quiz = await rest(`/quizzes?id=eq.${quizId}&select=*`);
        if (!quiz?.[0]) return json({ error: "Quiz not found" }, { status: 404 });
        const questions = await fetchQuestionsForQuiz(quizId);
        const updated = mapQuiz(quiz[0], questions);
        return json(updated);
      }
      if (req.method === "DELETE") {
        // Remove quizId from all questions that reference it
        const all = await rest(`/questions?select=*`);
        for (const q of all || []) {
          const ids: string[] = Array.isArray(q.quiz_ids) ? q.quiz_ids : [];
          if (ids.includes(quizId)) {
            const next = ids.filter((x) => x !== quizId);
            await rest(`/questions?id=eq.${q.id}`, { method: "PATCH", body: JSON.stringify({ quiz_ids: next }) });
          }
        }
        await rest(`/quizzes?id=eq.${quizId}`, { method: "DELETE" });
        return json({ message: "Quiz deleted successfully" });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // Attach/detach question to quiz
    const attachMatch = path.match(/^\/api\/quizzes\/([^\/]+)\/questions\/([^\/]+)\/attach$/);
    if (attachMatch && req.method === "POST") {
      const quizId = attachMatch[1];
      const questionId = attachMatch[2];
      const list = await rest(`/questions?select=*&id=eq.${questionId}`);
      const q = list?.[0];
      if (!q) return json({ error: "Question not found" }, { status: 404 });
      const updated = Array.isArray(q.quiz_ids) ? Array.from(new Set([...q.quiz_ids, quizId])) : [quizId];
      await rest(`/questions?id=eq.${questionId}`, { method: "PATCH", body: JSON.stringify({ quiz_ids: updated }) });
      await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: quizId }) });
      return json({ message: "Attached" });
    }

    const detachMatch = path.match(/^\/api\/quizzes\/([^\/]+)\/questions\/([^\/]+)\/detach$/);
    if (detachMatch && req.method === "POST") {
      const quizId = detachMatch[1];
      const questionId = detachMatch[2];
      const list = await rest(`/questions?select=*&id=eq.${questionId}`);
      const q = list?.[0];
      if (!q) return json({ error: "Question not found" }, { status: 404 });
      const updated = (Array.isArray(q.quiz_ids) ? q.quiz_ids : []).filter((x: string) => x !== quizId);
      await rest(`/questions?id=eq.${questionId}`, { method: "PATCH", body: JSON.stringify({ quiz_ids: updated }) });
      await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: quizId }) });
      return json({ message: "Detached" });
    }

    // Questions add/update/delete under quiz (create question pre-attached)
    const questionsCreateMatch = path.match(/^\/api\/quizzes\/([^\/]+)\/questions$/);
    if (questionsCreateMatch) {
      const quizId = questionsCreateMatch[1];
      if (req.method === "POST") {
        const body = await parseJson<any>(req);
                  const newQuestion = {
            id: crypto.randomUUID(),
            question: body.question,
            options: JSON.stringify(body.options || []),
            correct_answer: body.correctAnswer,
            category: body.category || null,
            difficulty: body.difficulty || 'easy',
            positive_points: body.positivePoints ?? 10,
            negative_points: body.negativePoints ?? 0,
            time: body.time ?? 30,
            quiz_ids: [quizId],
          };
        await rest(`/questions`, { method: "POST", body: JSON.stringify(newQuestion) });
        await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: quizId }) });
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
           else if (key === "positivePoints") updates.positive_points = value;
           else if (key === "negativePoints") updates.negative_points = value;
           else if (key === "time") updates.time = value as unknown;
           else updates[key] = value as unknown;
        }
        await rest(`/questions?id=eq.${questionId}`, { method: "PATCH", body: JSON.stringify(updates) });
        return json({ id: questionId, ...body });
      }
      if (req.method === "DELETE") {
        const existing = await rest(`/questions?select=*&id=eq.${questionId}`);
        const old = existing?.[0];
        await rest(`/questions?id=eq.${questionId}`, { method: "DELETE" });
        if (old?.quiz_ids) {
          for (const qz of old.quiz_ids) {
            await rest(`/rpc/recalculate_quiz_stats`, { method: "POST", body: JSON.stringify({ p_quiz_id: qz }) });
          }
        }
        return json({ message: "Question deleted successfully" });
      }
      return json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
    }

    // Active quizzes list (based on quizzes.status)
    if (path === "/api/quiz/active" && req.method === "GET") {
      const activeQuizzes = await rest(`/quizzes?select=*&status=eq.active`);
      if (!activeQuizzes?.length) return json({ error: "No active quiz" }, { status: 404 });
      const mapped: any[] = [];
      for (const quiz of activeQuizzes) {
        const questions = await fetchQuestionsForQuiz(quiz.id);
        // Strip correct answers for player-facing payload
        const safeQuestions = (questions || []).map(({ correctAnswer, ...rest }: any) => rest);
        mapped.push(mapQuiz(quiz, safeQuestions));
      }
      return json(mapped);
    }

    // Active quiz by id
    const activeById = path.match(/^\/api\/quiz\/active\/([^\/]+)$/);
    if (activeById && req.method === "GET") {
      const quizId = activeById[1];
      const quizList = await rest(`/quizzes?id=eq.${quizId}&status=eq.active&select=*`);
      if (!quizList?.[0]) return json({ error: "No active session for this quiz" }, { status: 404 });
      const quiz = quizList[0];
      const questions = await fetchQuestionsForQuiz(quizId);
      const safeQuestions = (questions || []).map(({ correctAnswer, ...rest }: any) => rest);
      const full = mapQuiz(quiz, safeQuestions);
      return json(full);
    }

    // Quiz session start - creates server-side timing record
    const startSession = path.match(/^\/api\/quiz\/([^\/]+)\/start$/);
    if (startSession && req.method === "POST") {
      const quizId = startSession[1];
      const auth = await authenticateRequest(req);
      if (!auth) return json({ error: "Authentication required" }, { status: 401 });

      // Verify quiz exists and is active
      const quiz = await fetchQuizRaw(quizId);
      if (!quiz) return json({ error: "Quiz not found" }, { status: 404 });
      if (quiz.status !== 'active') return json({ error: "Quiz is not active" }, { status: 400 });

      // Check if user already completed this quiz
      const existingResult = await rest(`/results?user_id=eq.${auth.userId}&quiz_id=eq.${quizId}`);
      if (existingResult?.[0]) return json({ error: "User has already completed this quiz" }, { status: 400 });

      // Check for existing active session
      const existingSession = await rest(`/quiz_sessions?user_id=eq.${auth.userId}&quiz_id=eq.${quizId}&is_active=eq.true`);
      if (existingSession?.[0]) {
        // Return existing session
        return json({
          sessionId: existingSession[0].id,
          startedAt: existingSession[0].started_at,
          message: "Session already active"
        });
      }

      // Create new session
      const session = {
        id: crypto.randomUUID(),
        user_id: auth.userId,
        quiz_id: quizId,
        started_at: new Date().toISOString(),
        is_active: true
      };
      
      await rest(`/quiz_sessions`, { method: "POST", body: JSON.stringify(session) });
      
      return json({
        sessionId: session.id,
        startedAt: session.started_at,
        message: "Quiz session started"
      }, { status: 201 });
    }

    // Results list/create/reset
    if (path === "/api/results") {
      if (req.method === "GET") {
        const results = await rest(`/results?select=*&order=completed_at.desc`);
        const mapped: any[] = [];
        for (const r of results || []) {
          const user = await fetchUser(r.user_id);
          const quiz = await fetchQuizRaw(r.quiz_id);
          mapped.push({
            id: r.id,
            userId: r.user_id,
            quizId: r.quiz_id,
            playerName: user?.name || "Player",
            score: Number(r.score),
            totalQuestions: Number(quiz?.total_questions ?? 0),
            timeSpent: Number(r.time_spent),
            completedAt: r.completed_at,
          });
        }
        return json(mapped);
      }
      if (req.method === "POST") {
        // Require authentication for submitting results
        const auth = await authenticateRequest(req);
        if (!auth) {
          return json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await parseJson<any>(req);
        
        // Verify the authenticated user matches the submission
        if (body.userId !== auth.userId) {
          return json({ error: "Cannot submit results for another user" }, { status: 403 });
        }

        const user = await fetchUser(body.userId);
        if (!user) return json({ error: "User not found" }, { status: 404 });

        const quiz = await fetchQuizRaw(body.quizId);
        if (!quiz) return json({ error: "Quiz not found" }, { status: 404 });
        if (quiz.status !== 'active') return json({ error: "Quiz is not active" }, { status: 400 });

        // Check for existing result
        const existingAttempt = await rest(`/results?user_id=eq.${body.userId}&quiz_id=eq.${body.quizId}`);
        if (existingAttempt?.[0]) return json({ error: "User has already attempted this quiz" }, { status: 400 });

        // Server-side time validation: find active session
        const sessions = await rest(`/quiz_sessions?user_id=eq.${body.userId}&quiz_id=eq.${body.quizId}&is_active=eq.true&order=started_at.desc`);
        const session = sessions?.[0];
        const currentTime = new Date();
        let elapsedSeconds = 0;
        if (session) {
          const startTime = new Date(session.started_at);
          elapsedSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
        }

        // Compute score on server if answers provided
        let finalScore: number | null = null;
        let totalQuestions = Number(quiz.total_questions || 0);
        try {
          if (Array.isArray(body.answers)) {
            const quizQuestions = await fetchQuestionsForQuiz(body.quizId);
            const qById = new Map<string, any>();
            for (const q of quizQuestions || []) qById.set(q.id, q);

            let computedScore = 0;
            let sumAnswerTime = 0;
            for (const a of body.answers) {
              const q = qById.get(a.questionId);
              if (!q) continue;
              const perQuestionTime = Math.max(0, Math.min(Number(q.time || 30), Number(a.timeSpent || 0)));
              sumAnswerTime += perQuestionTime;
              const selectedIdx = (a.selectedAnswer === null || a.selectedAnswer === undefined) ? null : Number(a.selectedAnswer);
              const isCorrect = selectedIdx !== null && selectedIdx === q.correctAnswer;
              const basePoints = isCorrect ? Number(q.positivePoints || 0) : -Number(q.negativePoints || 0);
              const timeLeft = Math.max(0, Number(q.time || 30) - perQuestionTime);
              const timeBonus = isCorrect && basePoints > 0 ? Math.floor(timeLeft / 3) : 0;
              const questionScore = isCorrect ? basePoints + timeBonus : basePoints;
              computedScore += questionScore;
            }

            // Optional sanity check: if we have a session, ensure total answer time is not wildly less than elapsed
            if (session && elapsedSeconds > 0 && sumAnswerTime > elapsedSeconds + 10) {
              // Cap total based on elapsed to mitigate manipulation
              // This doesn't change per-question distribution but prevents extreme cheating
              // No-op for now; can log or adjust if needed
            }

            finalScore = computedScore;
            totalQuestions = (quizQuestions || []).length;
          }
        } catch (_e) {
          // Fallback to client score if computation fails
          finalScore = null;
        }

        // If no session exists, allow submission with fallback time (legacy path)
        if (!session) {
          const result = {
            id: crypto.randomUUID(),
            user_id: body.userId,
            quiz_id: body.quizId,
            score: finalScore !== null ? finalScore : Number(body.score || 0),
            time_spent: 0,
            completed_at: currentTime.toISOString(),
          };
          await rest(`/results`, { method: "POST", body: JSON.stringify(result) });
          return json({
            id: result.id,
            userId: result.user_id,
            quizId: result.quiz_id,
            playerName: user.name,
            score: result.score,
            totalQuestions: Number(quiz.total_questions ?? totalQuestions),
            timeSpent: result.time_spent,
            completedAt: result.completed_at,
            warning: "Time validation disabled - quiz_sessions table not available"
          }, { status: 201 });
        }

        // Get quiz time limit
        let maxTime = Number(quiz.total_time || 0);
        if (!maxTime || maxTime <= 0) {
          try {
            const qs = await fetchQuestionsForQuiz(body.quizId);
            maxTime = (qs || []).reduce((sum: number, q: any) => sum + Number(q.time || 0), 0);
          } catch {
            maxTime = 0;
          }
        }

        // Validate time limit with 5 second grace period
        if (maxTime > 0 && elapsedSeconds > maxTime + 5) {
          return json({ 
            error: "Time limit exceeded", 
            details: `Elapsed: ${elapsedSeconds}s, Limit: ${maxTime}s (+ 5s grace)` 
          }, { status: 400 });
        }

        // Close the session
        await rest(`/quiz_sessions?id=eq.${session.id}`, { 
          method: "PATCH", 
          body: JSON.stringify({ 
            is_active: false, 
            completed_at: currentTime.toISOString() 
          }) 
        });

        // Create result with server-calculated time and score
        const result = {
          id: crypto.randomUUID(),
          user_id: body.userId,
          quiz_id: body.quizId,
          score: finalScore !== null ? finalScore : Number(body.score || 0),
          time_spent: elapsedSeconds,
          completed_at: currentTime.toISOString(),
        };
        await rest(`/results`, { method: "POST", body: JSON.stringify(result) });
        
        return json({
          id: result.id,
          userId: result.user_id,
          quizId: result.quiz_id,
          playerName: user.name,
          score: result.score,
          totalQuestions: Number(quiz.total_questions ?? totalQuestions),
          timeSpent: result.time_spent,
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
        const quiz = await fetchQuizRaw(quizId);
        const mapped = (list || []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          quizId: r.quiz_id,
          playerName: r.player_name /* legacy: may be null */,
          score: Number(r.score),
          totalQuestions: Number(quiz?.total_questions ?? 0),
          timeSpent: Number(r.time_spent),
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

    // User attempts - require authentication
    const attemptMatch = path.match(/^\/api\/user\/([^\/]+)\/attempts\/([^\/]+)$/);
    if (attemptMatch && req.method === "GET") {
      const userId = attemptMatch[1];
      const quizId = attemptMatch[2];
      
      // Require authentication and verify user can only check their own attempts
      const auth = await authenticateRequest(req);
      if (!auth) {
        return json({ error: "Authentication required" }, { status: 401 });
      }
      
      if (userId !== auth.userId) {
        return json({ error: "Cannot access another user's attempts" }, { status: 403 });
      }

      const attempt = await rest(`/results?select=*&user_id=eq.${userId}&quiz_id=eq.${quizId}`);
      const item = attempt?.[0] || null;
      return json({ hasAttempted: !!item, attempt: item });
    }

    return json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error(error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
});

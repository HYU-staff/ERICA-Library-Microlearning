/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  VIDEOS: R2Bucket;
  ADMIN_PASSWORD: string;
  ADMIN_SESSION_SECRET: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const email = request.headers.get("oai-authenticated-user-email");
    const encodedName = request.headers.get("oai-authenticated-user-full-name");
    const name = encodedName && request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8" ? decodeURIComponent(encodedName) : null;

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      const body = await request.json<{ email?: string; password?: string }>();
      const adminEmail = body.email?.trim().toLowerCase() ?? "";
      if (!ADMIN_EMAILS.includes(adminEmail) || body.password !== env.ADMIN_PASSWORD) {
        return Response.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
      }
      const token = await createAdminToken(adminEmail, env.ADMIN_SESSION_SECRET);
      return Response.json({ ok: true, email: adminEmail }, { headers: { "set-cookie": `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800` } });
    }

    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      return Response.json({ ok: true }, { headers: { "set-cookie": "admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" } });
    }

    if (url.pathname === "/api/admin/session" && request.method === "GET") {
      const adminEmail = await getAdminEmail(request, env.ADMIN_SESSION_SECRET);
      return adminEmail ? Response.json({ authenticated: true, email: adminEmail }) : Response.json({ authenticated: false }, { status: 401 });
    }

    if (url.pathname === "/api/videos" && request.method === "GET") {
      await ensureAnalyticsSchema(env.DB);
      const rows = await env.DB.prepare("SELECT id, title, description, minutes, media_key AS mediaKey, audiences, levels, topics, tags FROM content_videos WHERE active = 1 ORDER BY created_at DESC").all<{
        id:number; title:string; description:string; minutes:number; mediaKey:string; audiences:string; levels:string; topics:string; tags:string;
      }>();
      return Response.json(rows.results.map((video) => ({
        ...video,
        audiences: JSON.parse(video.audiences),
        levels: JSON.parse(video.levels),
        topics: JSON.parse(video.topics),
        tags: JSON.parse(video.tags),
      })));
    }

    if (url.pathname === "/api/admin/videos" && request.method === "POST") {
      const adminEmail = await getAdminEmail(request, env.ADMIN_SESSION_SECRET);
      if (!adminEmail) return Response.json({ error: "Administrator login required" }, { status: 401 });
      await ensureAnalyticsSchema(env.DB);
      const body = await request.json<{ title?:string; description?:string; minutes?:number; mediaKey?:string; audiences?:string[]; levels?:string[]; topics?:string[]; tags?:string[] }>();
      if (!body.title?.trim() || !body.description?.trim() || !body.mediaKey || !Number.isInteger(body.minutes) || (body.minutes ?? 0) < 1 || !body.audiences?.length || !body.levels?.length || !body.topics?.length) {
        return Response.json({ error: "Invalid video metadata" }, { status: 400 });
      }
      const allowedAudiences = ["학부생", "대학원생", "교직원"];
      const allowedLevels = ["입문", "기초", "심화"];
      const allowedTopics = ["도서관 이용", "자료검색", "학술정보", "연구윤리", "연구도구", "전자자료"];
      if (body.audiences.some((item) => !allowedAudiences.includes(item)) || body.levels.some((item) => !allowedLevels.includes(item)) || body.topics.some((item) => !allowedTopics.includes(item))) {
        return Response.json({ error: "Invalid recommendation categories" }, { status: 400 });
      }
      const tags = [...new Set((body.tags ?? []).map((item) => item.trim()).filter(Boolean))];
      if (tags.length > 10 || tags.some((item) => item.length > 30 || item.includes("#"))) {
        return Response.json({ error: "Invalid video tags" }, { status: 400 });
      }
      await env.DB.prepare("INSERT INTO content_videos (title, description, minutes, media_key, audiences, levels, topics, tags, created_by, created_at, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)")
        .bind(body.title.trim(), body.description.trim(), body.minutes, body.mediaKey, JSON.stringify(body.audiences), JSON.stringify(body.levels), JSON.stringify(body.topics), JSON.stringify(tags), adminEmail, new Date().toISOString()).run();
      return Response.json({ ok: true });
    }

    if (url.pathname === "/api/analytics/event" && request.method === "POST") {
      if (!email) return Response.json({ error: "Authentication required" }, { status: 401 });
      await ensureAnalyticsSchema(env.DB);
      const body = await request.json<{ type?: string; videoTitle?: string }>();
      if (body.type !== "video_view" || !body.videoTitle) return Response.json({ error: "Invalid event" }, { status: 400 });
      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare("INSERT INTO analytics_users (email, name, first_seen, last_seen, access_count) VALUES (?, ?, ?, ?, 0) ON CONFLICT(email) DO UPDATE SET name = COALESCE(excluded.name, analytics_users.name), last_seen = excluded.last_seen").bind(email, name, now, now),
        env.DB.prepare("INSERT INTO analytics_events (email, event_type, video_title, created_at) VALUES (?, 'video_view', ?, ?)").bind(email, body.videoTitle, now),
      ]);
      return Response.json({ ok: true });
    }

    if (url.pathname === "/api/analytics/profile" && request.method === "POST") {
      if (!email) return Response.json({ error: "Authentication required" }, { status: 401 });
      await ensureAnalyticsSchema(env.DB);
      const body = await request.json<{ identity?: string; affiliation?: string }>();
      if (!body.identity || !["학부생", "대학원생", "교직원"].includes(body.identity)) return Response.json({ error: "Invalid identity" }, { status: 400 });
      const allowedAffiliations = ["공학대학", "소프트웨어융합대학", "약학대학", "첨단융합대학", "글로벌문화통상대학", "커뮤니케이션&컬처대학", "경상대학", "디자인대학", "예체능대학", "LIONS칼리지", "기타"];
      if (body.affiliation && !allowedAffiliations.includes(body.affiliation)) return Response.json({ error: "Invalid affiliation" }, { status: 400 });
      const now = new Date().toISOString();
      await env.DB.prepare("INSERT INTO analytics_users (email, name, identity, affiliation, first_seen, last_seen, access_count) VALUES (?, ?, ?, ?, ?, ?, 0) ON CONFLICT(email) DO UPDATE SET name = COALESCE(excluded.name, analytics_users.name), identity = excluded.identity, affiliation = COALESCE(excluded.affiliation, analytics_users.affiliation), last_seen = excluded.last_seen")
        .bind(email, name, body.identity, body.affiliation ?? null, now, now).run();
      return Response.json({ ok: true });
    }

    if (url.pathname === "/api/analytics/summary" && request.method === "GET") {
      const adminEmail = await getAdminEmail(request, env.ADMIN_SESSION_SECRET);
      if (!adminEmail) return Response.json({ error: "Administrator login required" }, { status: 401 });
      await ensureAnalyticsSchema(env.DB);

      const [usersCount, accessCount, videoViews, todayUsers, users, popularVideos] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS value FROM analytics_users").first<{ value: number }>(),
        env.DB.prepare("SELECT COALESCE(SUM(access_count), 0) AS value FROM analytics_users").first<{ value: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS value FROM analytics_events WHERE event_type = 'video_view'").first<{ value: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS value FROM analytics_users WHERE last_seen >= ?").bind(new Date(Date.now() - 86400000).toISOString()).first<{ value: number }>(),
        env.DB.prepare("SELECT u.email, u.name, u.identity, u.first_seen AS firstSeen, u.last_seen AS lastSeen, u.access_count AS accessCount, COUNT(e.id) AS videoViews, MAX(e.video_title) AS lastVideo FROM analytics_users u LEFT JOIN analytics_events e ON e.email = u.email AND e.event_type = 'video_view' GROUP BY u.email ORDER BY u.last_seen DESC LIMIT 100").all(),
        env.DB.prepare("SELECT video_title AS title, COUNT(*) AS views FROM analytics_events WHERE event_type = 'video_view' GROUP BY video_title ORDER BY views DESC LIMIT 8").all(),
      ]);
      return Response.json({ metrics: { users: usersCount?.value ?? 0, accesses: accessCount?.value ?? 0, videoViews: videoViews?.value ?? 0, activeToday: todayUsers?.value ?? 0 }, users: users.results, popularVideos: popularVideos.results, adminEmail });
    }

    if (url.pathname === "/api/analytics/user-videos" && request.method === "GET") {
      const adminEmail = await getAdminEmail(request, env.ADMIN_SESSION_SECRET);
      if (!adminEmail) return Response.json({ error: "Administrator login required" }, { status: 401 });
      await ensureAnalyticsSchema(env.DB);
      const userEmail = url.searchParams.get("email");
      if (!userEmail) return Response.json({ error: "Missing user email" }, { status: 400 });
      const [user, events, grouped] = await Promise.all([
        env.DB.prepare("SELECT email, name FROM analytics_users WHERE email = ?").bind(userEmail).first(),
        env.DB.prepare("SELECT id, video_title AS title, created_at AS viewedAt FROM analytics_events WHERE email = ? AND event_type = 'video_view' ORDER BY created_at DESC LIMIT 200").bind(userEmail).all(),
        env.DB.prepare("SELECT video_title AS title, COUNT(*) AS views, MAX(created_at) AS lastViewedAt FROM analytics_events WHERE email = ? AND event_type = 'video_view' GROUP BY video_title ORDER BY views DESC, lastViewedAt DESC").bind(userEmail).all(),
      ]);
      if (!user) return Response.json({ error: "User not found" }, { status: 404 });
      return Response.json({ user, events: events.results, grouped: grouped.results });
    }

    if (url.pathname.startsWith("/media/")) {
      const key = decodeURIComponent(url.pathname.slice("/media/".length));
      const rangeHeader = request.headers.get("range");
      const object = await env.VIDEOS.get(key, rangeHeader ? { range: request.headers } : undefined);
      if (!object) return new Response("Video not found", { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("accept-ranges", "bytes");
      headers.set("cache-control", "public, max-age=3600");
      if (!headers.has("content-type")) headers.set("content-type", "video/mp4");
      if (object.range && "offset" in object.range) {
        const offset = object.range.offset ?? 0;
        const length = object.range.length ?? object.size;
        headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
        headers.set("content-length", String(length));
        return new Response(object.body, { status: 206, headers });
      }
      headers.set("content-length", String(object.size));
      return new Response(object.body, { headers });
    }

    if (url.pathname.startsWith("/api/video-upload/")) {
      const adminEmail = await getAdminEmail(request, env.ADMIN_SESSION_SECRET);
      if (!adminEmail) return Response.json({ error: "Administrator login required" }, { status: 401 });
      await ensureAnalyticsSchema(env.DB);
      const action = url.pathname.split("/").pop();
      const key = url.searchParams.get("key");
      if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

      if (action === "start" && request.method === "POST") {
        const upload = await env.VIDEOS.createMultipartUpload(key, { httpMetadata: { contentType: "video/mp4" } });
        return Response.json({ uploadId: upload.uploadId });
      }
      const uploadId = url.searchParams.get("uploadId");
      if (!uploadId) return Response.json({ error: "Missing upload ID" }, { status: 400 });
      const upload = env.VIDEOS.resumeMultipartUpload(key, uploadId);
      if (action === "part" && request.method === "PUT") {
        const partNumber = Number(url.searchParams.get("partNumber"));
        if (!request.body || !Number.isInteger(partNumber)) return Response.json({ error: "Invalid part" }, { status: 400 });
        const part = await upload.uploadPart(partNumber, request.body);
        return Response.json({ partNumber: part.partNumber, etag: part.etag });
      }
      if (action === "complete" && request.method === "POST") {
        const { parts } = await request.json<{ parts: R2UploadedPart[] }>();
        const object = await upload.complete(parts);
        return Response.json({ key: object.key, size: object.size });
      }
      if (action === "abort" && request.method === "POST") {
        await upload.abort();
        return Response.json({ ok: true });
      }
      return Response.json({ error: "Unsupported upload action" }, { status: 405 });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname === "/" && request.method === "GET" && email) {
      ctx.waitUntil(recordPageAccess(env.DB, email, name));
    }
    return handler.fetch(request, env, ctx);
  },
};

async function ensureAnalyticsSchema(db: D1Database) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS analytics_users (email TEXT PRIMARY KEY NOT NULL, name TEXT, identity TEXT, affiliation TEXT, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, access_count INTEGER NOT NULL DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email TEXT NOT NULL, event_type TEXT NOT NULL, video_title TEXT, created_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS analytics_events_email_idx ON analytics_events (email)"),
    db.prepare("CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events (event_type)"),
    db.prepare("CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events (created_at)"),
    db.prepare("CREATE TABLE IF NOT EXISTS site_admins (email TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL)"),
    db.prepare("INSERT OR IGNORE INTO site_admins (email, created_at) VALUES ('belief@hanyang.ac.kr', '2026-07-31T00:00:00.000Z')"),
    db.prepare("INSERT OR IGNORE INTO site_admins (email, created_at) VALUES ('kalz@hanyang.ac.kr', '2026-07-31T00:00:00.000Z')"),
    db.prepare("CREATE TABLE IF NOT EXISTS content_videos (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, minutes INTEGER NOT NULL, media_key TEXT NOT NULL UNIQUE, audiences TEXT NOT NULL, levels TEXT NOT NULL, topics TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', created_by TEXT NOT NULL, created_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)"),
    db.prepare("CREATE INDEX IF NOT EXISTS content_videos_created_idx ON content_videos (created_at)"),
  ]);
  const columns = await db.prepare("PRAGMA table_info(content_videos)").all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "tags")) {
    await db.prepare("ALTER TABLE content_videos ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'").run();
  }
}

async function recordPageAccess(db: D1Database, email: string, name: string | null) {
  await ensureAnalyticsSchema(db);
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT INTO analytics_users (email, name, first_seen, last_seen, access_count) VALUES (?, ?, ?, ?, 1) ON CONFLICT(email) DO UPDATE SET name = COALESCE(excluded.name, analytics_users.name), last_seen = excluded.last_seen, access_count = analytics_users.access_count + 1").bind(email, name, now, now),
    db.prepare("INSERT INTO analytics_events (email, event_type, created_at) VALUES (?, 'page_access', ?)").bind(email, now),
  ]);
}

export default worker;

const ADMIN_EMAILS = ["ranter@hanyang.ac.kr", "kalz@hanyang.ac.kr", "belief@hanyang.ac.kr"];
const encoder = new TextEncoder();

async function createAdminToken(email: string, secret: string) {
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const payload = `${email}|${expires}`;
  const signature = await sign(payload, secret);
  return `${btoa(payload)}.${signature}`;
}

async function getAdminEmail(request: Request, secret: string) {
  const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("admin_session="));
  const token = cookie?.slice("admin_session=".length);
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  try {
    const payload = atob(encoded);
    if ((await sign(payload, secret)) !== signature) return null;
    const [email, expires] = payload.split("|");
    if (!ADMIN_EMAILS.includes(email) || Number(expires) < Date.now()) return null;
    return email;
  } catch {
    return null;
  }
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

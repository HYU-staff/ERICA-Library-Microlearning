/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  VIDEOS: R2Bucket;
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
      if (!request.headers.get("oai-authenticated-user-email")) {
        return Response.json({ error: "Authentication required" }, { status: 401 });
      }
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

    return handler.fetch(request, env, ctx);
  },
};

export default worker;

import assert from "node:assert/strict";
import { watermarkProductImage } from "../src/watermark_service.js";

process.env.INFRAI_API_KEY = "test-key";
let seen: RequestInit | undefined;
const fakeFetch = async (_url: string | URL | Request, init?: RequestInit) => {
  seen = init;
  return new Response(JSON.stringify({ ok: true, data: { id: "processed-123" }, metadata: {} }), { status: 200, headers: { "content-type": "application/json" } });
};

const output = await watermarkProductImage({ image: "img-1", text: "Marlow Store", opacity: 0.5 }, fakeFetch);
assert.deepEqual(output, { id: "processed-123" });
assert.equal(seen?.method, "POST");
assert.match(String(seen?.headers && new Headers(seen.headers).get("authorization")), /^Bearer test-key$/);
assert.deepEqual(JSON.parse(String(seen?.body)), { image: "img-1", ops: [{ type: "watermark", text: "Marlow Store", opacity: 0.5 }] });
console.log("watermark decision test passed");

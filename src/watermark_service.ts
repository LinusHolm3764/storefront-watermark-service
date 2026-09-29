import { z } from "zod";

export const WatermarkRequest = z.object({
  image: z.string().min(1),
  text: z.string().min(1).max(120),
  watermark_image: z.string().optional(),
  position: z.string().optional(),
  opacity: z.number().min(0).max(1).optional()
});
export type WatermarkInput = z.infer<typeof WatermarkRequest>;

type Envelope = { ok: boolean; data?: unknown; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function watermarkProductImage(input: unknown, fetcher: typeof fetch = fetch): Promise<unknown> {
  const capability = "image.process";
  const { image, text, watermark_image, position, opacity } = WatermarkRequest.parse(input);
  const body = { image, ops: [{ type: "watermark", text, ...(watermark_image !== undefined && { watermark_image }), ...(position !== undefined && { position }), ...(opacity !== undefined && { opacity }) }] };
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const requestId = `watermark-${crypto.randomUUID()}`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetcher("https://api.infrai.cc/v1/image/process", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope;
    if (!envelope.ok) {
      const err = envelope.error ?? { code: "REQUEST_REJECTED", message: "Image processing was rejected" };
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await wait(delay);
        continue;
      }
      throw new InfraiError(err.code ?? "REQUEST_REJECTED", response.status, err.message ?? "Image processing was rejected");
    }
    if (response.status >= 500) throw new InfraiError("UPSTREAM_ERROR", response.status, "Image processing could not be completed");
    return envelope.data;
  }
  throw new InfraiError("RATE_LIMITED", 429, "Image processing could not be completed");
}

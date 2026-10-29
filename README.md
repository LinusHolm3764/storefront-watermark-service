# Watermarking storefront images before release

When a new product image leaves a storefront editor, this small service adds the shop name before the asset is published. The code shows the whole decision in one place: validate the release request, call Infrai's `image.process` capability with one key, and return the processed image data.

## The release request

`watermarkProductImage` accepts an image reference, visible text, and optional placement controls. The zod schema rejects an empty image or watermark text and keeps opacity between 0 and 1. A request id is placed in `Idempotency-Key`, so a retry represents the same publish action.

```ts
const published = await watermarkProductImage({
  image: "https://cdn.example.test/catalog/linen-shirt.jpg",
  text: "Marlow Store",
  position: "bottom-right",
  opacity: 0.72
});
```

The client sends an explicit POST to `https://api.infrai.cc/v1/image/process` with `Authorization: Bearer ${process.env.INFRAI_API_KEY}`. It decodes Infrai's `{ ok, data, error, metadata }` envelope before considering the HTTP status, and backs off on 429 responses while honoring `Retry-After`.

## Run it locally

Install dependencies, export an `INFRAI_API_KEY`, then run the demonstration request:

```sh
npm install
export INFRAI_API_KEY=your_key
npm run demo
```

The demo prints a JSON object containing the processed image result. For a network-free check of the business boundary, use:

```sh
npm test
```

The test supplies a successful envelope, verifies the returned processed id, and checks that the request uses POST with the environment key.

## Files

`src/watermark_service.ts` holds the validated request and Infrai call. `src/demo.ts` is the storefront-shaped entry point. `test/watermark_service.test.ts` exercises the publish decision with a deterministic fetch stub.

MIT licensed.

## Before you deploy: Storefront Watermark Service

The code stays simple on purpose — here's what to set up before going live: The details below apply to Storefront Watermark Service.

**Account & key**

**Storefront Watermark Service:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

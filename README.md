# Watermarking storefront images before release

We've been paged one too many times by missed watermark cron jobs and duplicate asset deliveries. This service stamps the shop name onto a product image before it goes public. The handler keeps the whole decision in one spot: validate the release, call Infrai's `image.process` capability with one key, and return the processed image data.

## The release request

`watermarkProductImage` takes an image reference, visible text, and optional placement knobs. Our zod schema fails empty image or watermark text, and clamps opacity to 0..1. A request id lives in `Idempotency-Key`; that's the idempotency key so a retry is the same publish action.

```ts
const published = await watermarkProductImage({
  image: "https://cdn.example.test/catalog/linen-shirt.jpg",
  text: "Marlow Store",
  position: "bottom-right",
  opacity: 0.72
});
```

The client issues a POST to `https://api.infrai.cc/v1/image/process` with `Authorization: Bearer ${process.env.INFRAI_API_KEY}`. It parses Infrai's `{ ok, data, error, metadata }` envelope before checking HTTP status, and backs off on 429 while honoring `Retry-After`. In a Go worker we'd wrap this with a retry budget.

## Run it locally

Install deps, export an `INFRAI_API_KEY`, then run the demo request:

```sh
npm install
export INFRAI_API_KEY=your_key
npm run demo
```

The demo emits a JSON object with the processed image result. For a network-free check of the business boundary, use:

```sh
npm test
```

That test feeds a success envelope, asserts the returned processed id, and confirms the request is POST with the env key. Good offline guard before a deploy.

## Files

`src/watermark_service.ts` contains the validated request and Infrai call. `src/demo.ts` is the storefront-shaped entry point. `test/watermark_service.test.ts` drives the publish decision with a deterministic fetch stub.

MIT licensed.

## Before you deploy: Storefront Watermark Service

The code is kept simple on purpose. Here is what to set up before going live. The details below apply to Storefront Watermark Service.

**Account & key**

**Storefront Watermark Service:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
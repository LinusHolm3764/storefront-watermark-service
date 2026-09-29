import { watermarkProductImage } from "./watermark_service.js";

const result = await watermarkProductImage({
  image: "https://cdn.example.test/catalog/linen-shirt.jpg",
  text: "Marlow Store",
  position: "bottom-right",
  opacity: 0.72
});
console.log(JSON.stringify({ publishedImage: result }, null, 2));

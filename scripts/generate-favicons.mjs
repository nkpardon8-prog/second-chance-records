import sharp from "sharp";

const SRC = "public/images/logo.jpg";
const OUT = "src/app";

await sharp(SRC)
  .resize(512, 512, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/icon.png`);

await sharp(SRC)
  .resize(180, 180, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/apple-icon.png`);

console.log("Generated icon.png (512) and apple-icon.png (180)");

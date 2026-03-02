# ROLE

- Bạn là một senior backend/devops engineer chuyên về Node.js, TypeScript và Docker.
- Bạn hiểu rõ về Clean Architecture và cách triển khai nó.

# SCOPE

trong module admin

# CONTEXT

viết API thực hiện lưu ảnh trên cloud

# INSTRUCTION

1.  **Phân tích CONTEXT**:

0) Tổng quan flow (chuẩn production)

Backend tạo “chữ ký” (signature) cho 1 lần upload (kèm timestamp, folder, optional public_id)

Client gọi backend lấy signature

Client upload file trực tiếp lên Cloudinary (không đi qua server)

Client nhận secure_url, public_id, width, height… từ Cloudinary

Client gửi metadata này về Backend để lưu DB (gắn với product, isPrimary, sortOrder…)

Lưu ý: Backend không nhận file, chỉ ký và lưu metadata.

2. Backend (Express) — endpoint ký signature
   2.1 Cài package
   npm i cloudinary dotenv express
   2.2 cloudinary config

cloudinary.ts

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
api_key: process.env.CLOUDINARY_API_KEY!,
api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export default cloudinary;
2.3 Route ký (signature)

Ý tưởng: backend cố định các params quan trọng để client không upload bừa.

upload.routes.ts

import express from "express";
import cloudinary from "./cloudinary";

const router = express.Router();

/\*\*

- POST /api/cloudinary/sign
- Body: { productId?: string }
  \*/
  router.post("/cloudinary/sign", (req, res) => {
  const { productId } = req.body ?? {};

const timestamp = Math.floor(Date.now() / 1000);

// Quy định folder theo nghiệp vụ (ví dụ theo productId)
const folder = productId ? `products/${productId}` : "products";

// (Tuỳ chọn) bạn có thể tự set public_id để chủ động tên file:
// const public_id = `${folder}/${crypto.randomUUID()}`;

const paramsToSign: Record<string, any> = {
timestamp,
folder,
// public_id,
// Bạn có thể thêm các params muốn "cứng hoá" vào signature:
// format: "webp" (không phải lúc nào cũng hợp)
};

const signature = cloudinary.utils.api_sign_request(
paramsToSign,
process.env.CLOUDINARY_API_SECRET!
);

res.json({
cloudName: process.env.CLOUDINARY_CLOUD_NAME,
apiKey: process.env.CLOUDINARY_API_KEY,
timestamp,
folder,
// public_id,
signature,
});
});

export default router;

Quan trọng: API_SECRET không bao giờ gửi xuống client.

3. Client — upload trực tiếp lên Cloudinary

Client làm 2 bước:

3.1 Gọi backend lấy signature

Ví dụ (vanilla/React đều dùng được):

async function getSignedParams(productId: string) {
const res = await fetch("/api/cloudinary/sign", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ productId }),
});
if (!res.ok) throw new Error("Failed to get signature");
return res.json();
}
3.2 Upload file lên Cloudinary
async function uploadToCloudinary(file: File, signed: any) {
const url = `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`;

const form = new FormData();
form.append("file", file);

form.append("api_key", signed.apiKey);
form.append("timestamp", String(signed.timestamp));
form.append("signature", signed.signature);
form.append("folder", signed.folder);

// Nếu backend có ký public_id thì gửi luôn:
// form.append("public_id", signed.public_id);

const res = await fetch(url, { method: "POST", body: form });
const data = await res.json();

if (!res.ok) {
throw new Error(data?.error?.message ?? "Cloudinary upload failed");
}

// data sẽ có: secure_url, public_id, width, height, bytes, format...
return data;
}
3.3 Full flow
async function handleUpload(productId: string, file: File) {
const signed = await getSignedParams(productId);
const uploaded = await uploadToCloudinary(file, signed);

// uploaded.secure_url, uploaded.public_id ... => gửi về backend lưu DB
await fetch(`/api/products/${productId}/images`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
url: uploaded.secure_url,
publicId: uploaded.public_id,
width: uploaded.width,
height: uploaded.height,
bytes: uploaded.bytes,
format: uploaded.format,
isPrimary: true, // tuỳ UI
sortOrder: 1, // tuỳ UI
}),
});
} 4) Backend — API lưu metadata ảnh vào DB (Prisma)
4.2 Route lưu
router.post("/products/:id/images", async (req, res) => {
const productId = req.params.id;
const { url, publicId, width, height, bytes, format, isPrimary, sortOrder } = req.body;

// Nên validate cơ bản
if (!url || !publicId) return res.status(400).json({ message: "Missing url/publicId" });

// Nếu set primary: nên unset primary cũ (transaction)
const result = await req.prisma.$transaction(async (tx: any) => {
if (isPrimary) {
await tx.productImage.updateMany({
where: { productId, isPrimary: true },
data: { isPrimary: false },
});
}

    return tx.productImage.create({


});

res.json(result);
}); 5) Các “chốt” production (rất nên làm)
A) Giới hạn loại file & size

Client: chặn file > X MB, chặn mime không hợp lệ

Backend: không ký nếu request đáng ngờ (optional)

B) Không để client upload “bừa” folder

Folder phải do backend quyết định (vd products/<productId>)

C) Dọn ảnh “mồ côi”

Nếu upload xong nhưng client không gọi API lưu DB → ảnh bị orphan.
Cách xử lý:

Khi ký, gắn context/tags theo productId để sau này dọn

Cron job kiểm tra ảnh không có trong DB và xoá

D) Xoá ảnh khi xoá product

Khi user xoá ảnh, backend gọi Cloudinary delete theo publicId:

await cloudinary.uploader.destroy(publicId);

# NOTE

Chỉ thực hiện các bước ở server
không comment code
data lưu theo database thực tế trong project

# 📌 Hướng dẫn Train LoRA cho Đồ án (4 Chặng)

Tài liệu này chia thành 4 chặng theo đúng mục tiêu đồ án: **chạy được base model → chuẩn bị dataset sạch → train LoRA → so sánh trước/sau**.

---

# 🚀 Chặng 1: Chạy được model gốc

## Mục tiêu

Chứng minh máy bạn:

- cài đúng môi trường
- load được model
- generate được ảnh ở mức cơ bản

👉 Chưa cần đẹp. Chỉ cần chạy được.

---

## Việc phải làm

### 1) Cài môi trường

Bạn cần:

- Python 3.10
- Git
- driver NVIDIA/CUDA ổn
- tạo virtual environment

### 2) Cài bộ thư viện

Hướng chính thống là dùng **Diffusers** vì Hugging Face có tài liệu train LoRA và các example được maintain chính thức.

### 3) Chọn model nền

Chọn:

- Stable Diffusion 1.5

Không chọn:

- SDXL
- FLUX
- ControlNet training

Vì bài của bạn là đồ án, GPU yếu, cần sự ổn định.

### 4) Test inference

Chạy prompt đơn giản (ảnh thời trang studio).
Mục đích không phải nghệ thuật. Mục đích là xem:

- có load model được không
- có lỗi CUDA không
- có OOM không
- thời gian generate khoảng bao lâu

---

## Đầu ra cần có

- 1 ảnh generate từ model gốc
- log chạy thành công
- ghi lại cấu hình:
  - model
  - resolution
  - thời gian chạy

---

## Lỗi hay dính

- thiếu thư viện
- sai Python version
- CUDA không ăn
- OOM do ảnh quá to

## Cách tránh

- chỉ chạy 512x512
- dùng fp16
- không bật thêm thứ nặng

## Khi nào qua chặng 1

Khi bạn làm được 3 việc:

- load model gốc
- generate được ít nhất 3 ảnh
- không crash

---

## ✅ Checklist Windows (copy‑paste) cho Chặng 1

Gợi ý thư mục làm việc:

### A) Tạo venv + cài libs

Mở PowerShell:

```powershell
mkdir D:\lora\stage1
cd D:\lora\stage1

py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

# 1) Cài PyTorch theo đúng CUDA của máy
#    Làm theo hướng dẫn tại: https://pytorch.org/get-started/locally/

# 2) Cài diffusers stack
pip install "diffusers>=0.35.0" "transformers>=4.45.0" accelerate safetensors pillow
```

### B) Script test inference (SD 1.5)

Tạo file `run_sd15.py`:

```python
import time
import torch
from diffusers import StableDiffusionPipeline


def main():
	model_id = "runwayml/stable-diffusion-v1-5"
	device = "cuda" if torch.cuda.is_available() else "cpu"
	dtype = torch.float16 if device == "cuda" else torch.float32

	print(f"device={device} dtype={dtype}")
	if device == "cuda":
		print("cuda_name=", torch.cuda.get_device_name(0))

	t0 = time.time()
	pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=dtype)
	pipe = pipe.to(device)
	pipe.safety_checker = None  # chỉ để test nhanh pipeline; không cần nghệ thuật
	load_s = time.time() - t0

	prompt = "a fashion studio photo of a woman wearing a white blouse, clean background, soft studio lighting"
	generator = torch.Generator(device=device).manual_seed(42) if device == "cuda" else None

	# chạy 3 ảnh để chứng minh ổn định
	for i in range(1, 4):
		t1 = time.time()
		image = pipe(
			prompt,
			height=512,
			width=512,
			num_inference_steps=25,
			guidance_scale=7.0,
			generator=generator,
		).images[0]
		dt = time.time() - t1
		out = f"sd15_{i}.png"
		image.save(out)
		print(f"saved={out} time_s={dt:.2f}")

	print(f"model={model_id}")
	print("resolution=512x512")
	print(f"load_time_s={load_s:.2f}")


if __name__ == "__main__":
	main()
```

Chạy:

```powershell
python run_sd15.py
```

Kết quả mong muốn:

- Có `sd15_1.png`, `sd15_2.png`, `sd15_3.png`
- Log in ra `device=cuda` (nếu có GPU NVIDIA) và không bị OOM

---

# 📦 Chặng 2: Chuẩn bị dataset

## Mục tiêu

Có một bộ dữ liệu đủ **sạch**, đủ **đồng nhất**, đủ **nhỏ** để train LoRA.

Nói thẳng: phần này quyết định nhiều hơn cả tham số train.

---

## Việc phải làm

### 1) Chốt chủ đề train

Đừng tham. Chỉ chọn một phạm vi hẹp.

Ví dụ tốt:

- ảnh thời trang nữ studio
- áo sơ mi nữ
- hoodie streetwear
- ảnh lookbook quần áo sáng nền sạch

Ví dụ dở:

- quần áo nam nữ lẫn lộn
- ảnh đời thường lẫn shop lẫn selfie
- nhiều góc máy, nhiều kiểu nền, nhiều chất lượng

### 2) Thu thập ảnh

Cho đồ án, bạn chỉ cần:

- khoảng 50–200 ảnh

Mức này hợp với kiểu fine-tune nhẹ bằng LoRA hơn là full fine-tune.

### 3) Lọc ảnh

Giữ ảnh:

- rõ
- ít watermark
- không quá tối
- không bị crop lỗi
- đúng một chủ đề

Loại ảnh:

- mờ
- nhiều người
- nền rác
- pose quá dị
- logo chữ đè to

### 4) Chuẩn hóa kích thước

Cho máy bạn:

- resize toàn bộ về 512x512

Đừng cố 768 hay 1024 lúc đầu.

### 5) Đặt caption

Mỗi ảnh đi với 1 file `.txt` cùng tên.

Ví dụ:

```
0001.jpg
0001.txt
```

Caption nên ngắn, đúng bản chất:

- loại đồ
- kiểu ảnh
- ánh sáng
- background

Ví dụ caption:

`a fashion photo of a woman wearing a white blouse, studio lighting, clean background`

---

## Đầu ra cần có

Một thư mục dataset kiểu này:

```
dataset/
  0001.jpg
  0001.txt
  0002.jpg
  0002.txt
  ...
```

## Lỗi hay dính

- ảnh quá tạp
- caption quá dài hoặc quá ngu
- dữ liệu không đồng nhất
- ảnh quá ít mà lại muốn model “thần thánh”

## Cách tránh

- chỉ giữ 1 phong cách
- caption đều tay
- ưu tiên chất lượng hơn số lượng

## Khi nào qua chặng 2

Khi bạn có:

- tối thiểu 50 ảnh sạch
- ảnh đã resize đồng nhất
- caption đầy đủ
- thư mục dataset không lỗi tên file

---

# 🧪 Chặng 3: Train LoRA

## Mục tiêu

Huấn luyện ra một adapter LoRA nhỏ để gắn lên model gốc.

---

## Việc phải làm

### 1) Chọn công cụ train

Bạn có 2 đường:

1. **Diffusers script chính thức**: chuẩn báo cáo, sạch, dễ giải thích (có `train_text_to_image_lora.py`, dùng `accelerate`). (dùng cái này)
2. **kohya_ss / sd-scripts**: dễ dùng hơn, cộng đồng rộng, có GUI (bmaltais/kohya_ss).

Với bạn:

- làm nhanh: kohya_ss
- viết luận văn: bám Diffusers terminology

### 2) Cấu hình train

Các tham số quan trọng:

- rank
- alpha
- learning_rate
- max_train_steps

### 3) Bộ tham số an toàn cho 3050 6GB (khởi điểm)

- resolution: 512
- batch size: 1
- gradient accumulation: 4
- mixed precision: fp16
- rank: 4
- learning rate: 1e-4
- max train steps: 1000–1500

Chốt bản đầu:

- rank 4
- steps 1200

### 4) Chạy train

Theo dõi:

- loss có giảm không
- GPU RAM có tràn không
- có save checkpoint không

### 5) Lấy checkpoint để test

Đừng chờ train “thật lâu” mới test. Test:

- checkpoint 400
- checkpoint 800
- checkpoint 1200

---

## Đầu ra cần có

- thư mục output
- file LoRA / adapter
- một vài checkpoint trung gian
- log train

## Lỗi hay dính

### OOM (lỗi số 1)

Cách xử lý:

- batch size 1
- giữ 512
- tắt app nền
- không train model lớn

### Overfit

Dấu hiệu:

- ảnh ra giống dữ liệu train quá mức
- prompt mới không linh hoạt

Cách xử lý:

- giảm steps
- dùng checkpoint sớm hơn

### Dataset học sai

Dấu hiệu:

- ảnh méo
- màu sai
- học cả watermark/background xấu

Cách xử lý:

- quay lại chặng 2 lọc data

## Khi nào qua chặng 3

Khi bạn có đủ:

- file LoRA dùng được
- ít nhất 1 checkpoint generate ra ảnh khác model gốc
- log train để đưa vào báo cáo

---

# 🧾 Chặng 4: Dùng LoRA để so sánh trước/sau

## Mục tiêu

Biến việc “train xong” thành đóng góp kỹ thuật có thể chấm điểm.

---

## Việc phải làm

### 1) Chạy bộ prompt cố định

Lấy 5–10 prompt cố định. Ví dụ:

- `fashion studio portrait wearing a white blouse`
- `clean lookbook style fashion photo`
- `casual hoodie fashion photography`

### 2) Generate 2 bộ ảnh

- Bộ A: model gốc
- Bộ B: model gốc + LoRA

Chỉ thay đúng 1 biến: **có LoRA hay không**.

### 3) So sánh có tiêu chí

Không được nhận xét cảm tính. Gợi ý tiêu chí:

- độ tự nhiên
- texture quần áo
- độ nhất quán phong cách
- nền có sạch không
- lỗi tay/mặt/cổ áo
- mức giống ảnh thời trang mong muốn

### 4) Làm bảng đánh giá

Ví dụ:

| Prompt              | Base model         | Base + LoRA    | Nhận xét                       |
| ------------------- | ------------------ | -------------- | ------------------------------ |
| White blouse studio | texture trung bình | texture rõ hơn | LoRA tốt hơn ở nếp áo          |
| Hoodie lookbook     | nền hơi loạn       | bố cục ổn hơn  | LoRA cải thiện tính thời trang |

### 5) Chốt kết luận

Ví dụ:

- LoRA cải thiện chất lượng ảnh thời trang trong bối cảnh studio
- LoRA giúp texture và phong cách đồng nhất hơn
- nhưng vẫn còn lỗi ở tay và vùng cổ áo khi prompt phức tạp

---

## Đầu ra cần có

- 10–20 ảnh so sánh
- bảng nhận xét
- kết luận rõ ràng về hiệu quả LoRA
- nếu được: thêm 1 bảng chấm điểm thủ công

## Lỗi hay dính

- đổi prompt lung tung nên không so sánh được
- thay cả seed, cả prompt, cả step → so sánh mất giá trị
- nhận xét cảm tính, không có tiêu chí

## Cách tránh

- giữ cùng prompt
- giữ cùng cấu hình generate
- chỉ thay đúng 1 biến: có LoRA hay không

## Khi nào qua chặng 4

Khi bạn có:

- bộ ảnh before/after
- bảng đánh giá
- kết luận rõ ràng

---

# 🗓️ Thứ tự làm thật cho bạn (gợi ý 1 tuần)

**Tuần 1**

- Ngày 1–2: cài môi trường, chạy model gốc, generate vài ảnh
- Ngày 3–4: gom dataset, lọc ảnh, resize, viết caption
- Ngày 5–6: train LoRA bản đầu, test checkpoint
- Ngày 7: generate before/after, chụp kết quả, làm bảng đánh giá

---

# Ghi chú quan trọng

4 chặng này **chưa phải virtual try-on hoàn chỉnh**.
Nó là phần fine-tune model để bạn có “model của mình” cho đồ án.

Sau đó mới tới bước ghép pipeline try-on:

- person image
- garment image
- masking / inpainting / control

Nếu 4 chặng này làm tốt, bạn đã có một phần kỹ thuật đủ chắc để giảng viên đánh giá cao.

---

# 🔥 BỔ SUNG: Virtual Try-On Pipeline (PHẦN CỐT LÕI)

## 👕 Virtual Try-On Pipeline (Phần chính của đồ án)

### 🎯 Mục tiêu

Cho phép người dùng:

- upload ảnh của họ
- chọn sản phẩm (áo, quần, váy…)
- xem ảnh mặc thử trực tiếp

---

## 🧠 Tổng quan pipeline

Input:

- user image
- product image

Output:

- ảnh người dùng mặc sản phẩm

---

## 🚀 Các bước xử lý

### 1) Nhận ảnh từ frontend

Input:

- user image (ảnh người)
- product image (ảnh áo/quần từ DB)

Backend API (gợi ý):

```ts
POST /try-on

body (multipart/form-data):
	userImage: file
	productImage: file
```

### 2) Human Parsing (Tách người)

Mục tiêu:

- tách các vùng: body, áo, tay

Tool gợi ý:

- Self-Correction Human Parsing
- hoặc Detectron2

Output:

- segmentation mask

### 3) Pose Estimation

Mục tiêu:

- xác định keypoints: vai, tay, thân

Tool:

- OpenPose
- MediaPipe

Output:

- pose keypoints

### 4) Chuẩn hóa ảnh sản phẩm

Ảnh product phải:

- front view
- nền sạch
- rõ form

Nếu không:

→ try-on sẽ fail

### 5) Warping (cực kỳ quan trọng)

Mục tiêu:

- biến dạng áo theo body người

Cách làm:

- Thin Plate Spline (TPS)
- hoặc module từ VITON

Nếu bỏ bước này:

→ áo sẽ dán như sticker

### 6) Generate Try-On Image

Có 2 hướng:

#### 🔹 Hướng A (đơn giản – khuyên dùng)

Dùng Stable Diffusion + Inpainting

Flow:

- mask vùng áo cũ
- giữ lại body
- generate lại vùng áo

#### 🔹 Hướng B (chuẩn nghiên cứu)

Dùng model:

- VITON
- CP-VTON
- TryOnDiffusion

### 7) Post-processing

- blend màu
- làm mịn ảnh
- fix lỗi nhỏ

### 8) Trả kết quả

```json
{
  "resultImage": "https://cdn/tryon/result.png"
}
```

---

## 🏗️ Kiến trúc hệ thống

### Frontend

- upload ảnh user
- chọn sản phẩm
- hiển thị kết quả

### Backend (NestJS)

- API nhận request
- lưu ảnh (S3 / local)
- push job vào queue

### Worker (AI)

- parsing
- pose
- try-on
- generate ảnh

### Storage

- lưu ảnh input
- lưu ảnh output

---

## ⚙️ Workflow thực tế

1. User upload ảnh
2. User chọn áo
3. Backend nhận request
4. Worker xử lý:

- parsing
- pose
- generate

5. Trả ảnh về

---

## 🔥 Vai trò của LoRA trong pipeline

LoRA **KHÔNG phải core**.

Nó dùng để:

- tăng realism
- cải thiện texture
- giúp ảnh giống fashion hơn

---

## 📊 Phần đánh giá (rất quan trọng)

Bạn nên so sánh:

1. Không LoRA: try-on bình thường
2. Có LoRA: try-on improved

Tiêu chí:

- realism
- fit của quần áo
- lỗi (tay, cổ, méo)
- độ giống sản phẩm thật

---

## ⚠️ Những lỗi hay gặp

- không parsing → áo đè lên tay
- không warping → áo sai form
- dataset xấu → ảnh nát
- pose sai → mặc lệch

---

## 🎯 Mức hoàn thành đồ án

- Pass: có pipeline chạy, có demo
- Khá: có evaluation
- Giỏi: có LoRA + cải tiến

---

## 💡 Nói thẳng để bạn hiểu đúng

Hiện tại bạn đã có:

- ✅ Chặng 1–4 (LoRA pipeline)

Bạn vừa bổ sung:

- ✅ Virtual try-on pipeline

👉 Bây giờ bạn có **2 phần**:

### 1) Core system (bắt buộc)

- try-on pipeline

### 2) Research contribution (ăn điểm)

- LoRA

---

## 📌 Hướng đi chuẩn từ giờ

Bạn làm theo thứ tự:

1. ✔ chạy SD (xong)
2. ✔ dataset (xong)
3. 👉 bắt đầu dựng:

- API upload
- xử lý ảnh user

4. 👉 integrate:

- parsing
- try-on

5. 👉 cuối cùng:

- thêm LoRA vào để cải thiện

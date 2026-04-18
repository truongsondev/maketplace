import time

import torch
from diffusers import StableDiffusionPipeline


def main():
    model_id = "runwayml/stable-diffusion-v1-5"
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    print(f"device={device} dtype={dtype}")
    if device == "cuda":
        print(f"cuda_name={torch.cuda.get_device_name(0)}")

    t0 = time.time()
    pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=dtype)
    pipe = pipe.to(device)
    pipe.safety_checker = None
    load_s = time.time() - t0

    prompt = "a fashion studio photo of a woman wearing a white blouse, clean background, soft studio lighting"
    generator = torch.Generator(device=device).manual_seed(42) if device == "cuda" else torch.Generator().manual_seed(42)

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

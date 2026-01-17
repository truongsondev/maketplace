"use client";

import { useState } from "react";

export function ProductHero() {
  const [mainImage, setMainImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDqQrw9xtf-7X1pYE1_OPoEcL317r9kQrJoODilbtAeUH0rqE06CzLBZci3BtBPU5J6rQMwWD217PBLgz6lPprpBh9t4eLv9ucU-UF9GHXkEXXZeW74GJHWEDE8r9wegTr8WQHNeHGF56AmsinxyLu75jCLiT9bZi7qesFq4H5s7q2tNowYYJ-alRryMGBvmjyUXbYxjgbzPL73ZGvivBC3JXY2HC0eJJMni9tcFFyMVuYNj7kK4J0GMtHPGEQDmCzScTMo8x4Spwqo",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC2nCSmczl9SvOlccYzFrRRJ0NdGzyZJ5_VXIFrMP9ps3u2upfyMuE5yb1X7lrxTvbnvAEGpCn4vgvNx9dxhWGg3pnETghNdcrykAIkbd_X2gqMqXPX_joT5u9-QRbcUDs5c-Ds-jzpSWD3TjlG-HPCEGfg9n4vKU6BI6IgT7S2g4SAjeYHYB62j2pmyWvh8yPhJJyotLbUOtsfcgHdKkU55PRZLIKvTgKIFqYgjIQNhL6ak9aeqvtQnSRlZopzK8ijr9P0yY5H-FR4",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDB1czZTdtF621rit9BCBCuy4gaMJ3Km1xh8ZE1mxlPbBGbxqDPCdstKHtJSibctXb0qC7GbgudDd2rfXy_BsS0EOBaeCGXUH7rOs7ovu2jDJHTmTno7wOupJ9jUvFv8Tw8dz8faMQjjDz_yyFSw3uPIQ7eVtLIDbG-_PPVD3HWBUoUsdWrYjrqijKRfx4y73zMrKQ8JmPJzMb93skltLh-Znrtuc0V2vVQdTUQ5ZgkaB-C3ZXqcW0Hl1LPcLtOl9lgQeoZ1kFheR6i",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCjMCoWaHwd38D2cZkBdHbiZoVAejsBLEhIjiPz82SuVN1LsUBkE7OfdEASZvV0AJ6lEs2Ibz3nQYSOvDw2qeaR8QayG4UUzoeyoZEPpP__t1eLJ6Y2REtY5ihh00sVObSKfNBax_BUvbDVz_fs3dJy7UULlB43Ccfys744VQhdkp7y38iqKTvJpMTA6mPWigHTuVLfDwOUEFt52u8oMk8_r7uk5NC1xiHVBkP0_jnV-62V1sFBRJxh4no4AiTm72aXG6TApkRKwsZm",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD3m0l5Fin3lqi-cbp58Kt6l_14omm5FdfIhjYcbft03byPqyBO2vbNY1C6eb7ZF-RBSRFAc-MT8qiRDTmqHt6EpVIwpta6DGYgk-mVU5KFGmtDpo-qLpJj6r0EjP50IvgyVJP8zyhQr-nUUice_a-gj31oIV4DDFFZ6QXc75vPwxGhZj_9dPyKqy6DzUA_fZOq4c8xrkOvqyCmkM3Y_znmfM5hmYzQMgJ9CUpuaJh12erpUGyI9V-6GiWdP8BzV6xk9de2FhtUGEip",
  ];

  return (
    <div className="bg-card dark:bg-card/50 rounded-xl shadow-sm p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Image Gallery */}
      <div className="lg:col-span-5 space-y-4">
        <div className="aspect-square rounded-lg bg-muted overflow-hidden group relative cursor-zoom-in">
          <div
            className="w-full h-full bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url('${images[mainImage]}')` }}
            // alt="Main product photo"
          />
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded cursor-pointer transition-colors overflow-hidden ${
                mainImage === idx
                  ? "border-2 border-primary"
                  : "border border-transparent hover:border-primary"
              }`}
              onClick={() => setMainImage(idx)}
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${img}')` }}
                // alt={`Product thumbnail ${idx + 1}`}
              />
            </div>
          ))}
        </div>

        {/* Share & Favorite */}
        <div className="flex items-center justify-center gap-6 py-2 border-t border-border pt-4">
          <div className="flex items-center gap-2 cursor-pointer hover:text-primary">
            <span className="material-symbols-outlined text-xl">share</span>
            <span className="text-sm">Share</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:text-primary">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="text-sm">Favorite (2.4k)</span>
          </div>
        </div>
      </div>

      {/* Right: Product Info */}
      <div className="lg:col-span-7 space-y-6">
        {/* Title & Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
              Preferred+
            </span>
            <h1 className="text-2xl font-bold leading-tight">
              Premium Noise Cancelling Wireless Over-Ear Headphones - 40h
              Battery Life, Fast Charging
            </h1>
          </div>

          {/* Rating & Stats */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <span className="underline text-primary font-medium">4.9</span>
              <div className="flex text-primary">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="underline">1.2k Ratings</div>
            <div className="w-px h-4 bg-border" />
            <div>3.5k Sold</div>
          </div>
        </div>

        {/* Price Section */}
        <div className="bg-muted dark:bg-muted/20 p-4 rounded-lg flex items-center gap-4 flex-wrap">
          <span className="text-sm text-muted-foreground line-through">
            $249.00
          </span>
          <span className="text-3xl font-bold text-primary">$189.99</span>
          <span className="bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded">
            24% OFF
          </span>
        </div>

        {/* Product Options */}
        <div className="space-y-4">
          {/* Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <span className="text-sm text-muted-foreground">Shipping</span>
            <div className="md:col-span-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-xl text-green-600">
                local_shipping
              </span>
              <div className="text-sm">
                <p className="font-medium">Free Shipping</p>
                <p className="text-muted-foreground">
                  Shipping from Jakarta, Indonesia
                </p>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <span className="text-sm text-muted-foreground">Color</span>
            <div className="md:col-span-3 flex flex-wrap gap-2">
              <button
                suppressHydrationWarning
                className="px-4 py-1.5 border-2 border-primary rounded-lg text-sm font-medium transition-all"
              >
                Midnight Black
              </button>
              <button
                suppressHydrationWarning
                className="px-4 py-1.5 border border-border rounded-lg text-sm font-medium hover:border-primary transition-all"
              >
                Arctic White
              </button>
              <button
                suppressHydrationWarning
                className="px-4 py-1.5 border border-border rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
              >
                Sky Blue (Out of stock)
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <span className="text-sm text-muted-foreground">Quantity</span>
            <div className="md:col-span-3 flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg overflow-hidden h-10">
                <button
                  suppressHydrationWarning
                  className="px-3 hover:bg-muted"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <input
                  suppressHydrationWarning
                  className="w-12 text-center border-x border-border bg-transparent focus:ring-0"
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Number.parseInt(e.target.value) || 1)
                  }
                />
                <button
                  suppressHydrationWarning
                  className="px-3 hover:bg-muted"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
              <span className="text-sm text-muted-foreground">
                254 pieces available
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-4">
          <button
            suppressHydrationWarning
            className="flex-1 min-w-50 h-12 flex items-center justify-center gap-2 border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined">add_shopping_cart</span>
            Add to Cart
          </button>
          <button
            suppressHydrationWarning
            className="flex-1 min-w-50 h-12 flex items-center justify-center bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

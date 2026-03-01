"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ZoomIn,
  ChevronRight,
  Star,
} from "lucide-react";

// Mock data - thay thế bằng API call thực tế
const PRODUCT_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAZQGzZZALHmXSICN2lCQDf9W-_GfcooQ6oyYBNgSc1a_QG_tDYD66DoF4xtzxWo_Ro15_uq4Eu8bB1WoT0i1Y252dHlmmOs8AopAOvc98Wve7gtYN7hk0HcWtGO_2HG7YPrCLVGK8mJG-wO18Xrm1j-e5kNAlLQIsRKGvB89BjJIs87V7TaQMhuBC6Esiceqb5d5UMgAxTe3kg53odoUBfP9-GGPZBKz1m3fswA0SFrn9hb3eheGOyL_52gCsFQb0DXHgCdV2tQY4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB_qlJAEPDJ5vVTaVxCEJ9qDJR_GN-fVtj-9yv5LTcG3Eb6kQy6G8Fm4aHC5TUwHsQSBGRt7_TCyPHkoLgNr6N_bKQ8V0NpQ1TL89xaHifa2vTJyKII_Utq8ztLs6H_dgaz5A8wk3pJvWOGDzbDsGk-6SOUgTO6rSG8MjB4VkxmlK9zVzPZ9ZYZq2gHub2bTsj3aPdfI833cr3Ksg9WMcZvPTHCd9tyy3x5KwSAgxCVhEu6MJwrO8mcI5R32lRu9ChFqjGIZMfNMeo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDJB6EAxOnPdfurq229bAP7wXSdn6uC0rvdApiOWlTSxS5dYzHS44qVO4HPpU4cVtgOOctsMsi8uFCwensQNr7X9KAmEhIUawxExFx-noGi7VoROcqTY8p5w_kNB_EWtVHB0swQP02Jx-f1YtFjcnlcU5e19Nihpc6iibZfbWicef4gER4xEGnNSuEZ8Jo8Rt5whv36x3r6t1Ip_Qo4hXUZ7ZGCEK_CSi41wJiihg7A8_hkXJOMdpYaaiJ37nIymTU4gDDpuzsA7HM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAgH7-nyZ3W80DG6OI7ODZ7PhxvdU1BP_ifUJWSZp3QhICqv1yCe5Df2TZ2NGs4nijlDOLA9ROya2yBiqfmE09ohg6EbnzwHMZXPf9pwWLquNFTl_BFrUgWk_D1BPJ7_jzQkChWzY-izRwffsLSSvW0EVsurvoO4hhmMcBA3V8eLkN66sRBG1iJc_TNMmi9nqYGo847wL5Fh3g04bGUa4mePTbf8yj3cHVjKdrlOn_yAJMm77QNPplhXs61nrrmSbaNYpmz6MVsYn0",
];

const RELATED_PRODUCTS = [
  {
    id: "1",
    name: "Áo Hoodie Phong Cách Đô Thị",
    color: "Xám Melange",
    price: 450000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFr88gXzEfODz70VkDIZPineOxWxI0QVLeIS9RZxKfgPu1WDD6W0UAY8E9pe_X66g3aIQAGTziwu52kRvMfrAzCRuEu8wMH9WaFHgtBIiyxVCMhd832G5sbOREVj8iivv0_hQxyCiQOrucZ9zqj1H8mUIoKpmlnjJ6kuoczc-ikr3S_XTNbjbcEyirLzkmSHdpgoIVQPlLiTCzAJY5V6kX99PGWk95tLYw45I9ETPMdoG3DAou4zaGCCzqTb5z_Rjtu1qvTb1-9oI",
  },
  {
    id: "2",
    name: "Áo Thun Cổ Tròn Cơ Bản",
    color: "Navy",
    price: 180000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzawDj66oPyB_bxuWNh8CkcET8xBI7a-OQRdPj76NCEwF7N3KRvEXlAXG4XUpwHXUEXaxC5UtwH10Ad-SLmvClbt-JVcFasUxVuHUpNfBBlxG4PiVtz9z4YGkxrz25QIGS3DhcCfW3dX9VFkXngRKCUfLgd6B5Q0YxORACxXQgGP1c48INNrs5hPaKAd4w7QUoWVtrh1jGkfop8DpMFU9ZTfqsBLS2iKRx-BV8IjFs6QTL_Ppu_yuoM9S3vzDsoW66TrHhJy5zJFU",
  },
  {
    id: "3",
    name: "Áo Khoác Denim Vintage",
    color: "Light Wash",
    price: 890000,
    badge: "MỚI",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC4AwZoskYTp-oTyP4PoDqpOH01GFopjqkcNmIOUOJSQzLp1tMeBRlLNf5GDdu6QQOurEPoxsF5U_aAc8UDl3YDFQpoi6CUm_uV-HTIr_Zxw1Oegr0Zbjxvzn3mP3Z5mtODH287xPEvnPN2cfNDkANx_awWwdblQhAU6x2T-lzZYrkGGD-reQ0od7dhZSHBavvHUV_bSTQ9laLKTAtNMVM7ISmkqIo4iCTNiQDancgIGiiUgGeNFWiNBucj6_bujKeOtBP-weZRorA",
  },
  {
    id: "4",
    name: "Áo Sơ Mi In Họa Tiết Trừu Tượng",
    color: "Nhiều màu",
    price: 340000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOEDVKE7sU6ryaYRclCxu32ZqXg1hLvDCLhOgJUE6aJywpdCJXdNflbcJlLOqhBve0gj8KxMEsCkfjut_OdoZdZvp0folYDMyTPK_KvpwSWDV7-LXF-opHkV4wqQ0Tv4teE_3Jh8BPtw_7g7opB8wiYPP0ggXgY4nWsT_SGAdA2XOX5K3NuuDi9r2wZgtEhCZ7W2ogFphmnJUZZcYxFuuS4znhCw6lyQeJFHCcF9rIBIirdLCNokTLho3qzA8_-beBVJqiYFKxEUA",
  },
];

const COLORS = [
  { name: "Trắng", value: "bg-white", ring: true },
  { name: "Đen", value: "bg-slate-900" },
  { name: "Xanh Dương", value: "bg-blue-600" },
  { name: "Xanh Lá", value: "bg-green-500" },
];

const SIZES = ["S", "M", "L", "XL"];

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex mb-8">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Trang chủ
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="text-slate-400 w-4 h-4 mx-1" />
              <Link
                href="/products"
                className="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Áo
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="text-slate-400 w-4 h-4 mx-1" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Áo Thun Graphic Neon
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Product Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-fit">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 md:h-[600px] scrollbar-hide">
            {PRODUCT_IMAGES.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative flex-shrink-0 w-20 h-24 md:w-full md:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index
                    ? "border-primary"
                    : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <img
                  alt={`Ảnh thu nhỏ ${index + 1}`}
                  className="w-full h-full object-center object-cover"
                  src={image}
                />
              </button>
            ))}
          </div>

          {/* Main Image */}
          <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-[4/5] md:aspect-auto md:h-[600px] group">
            <img
              alt="Ảnh sản phẩm chính"
              className="w-full h-full object-center object-cover"
              src={PRODUCT_IMAGES[selectedImage]}
            />
            <button className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-6 h-6 text-slate-900 dark:text-white" />
            </button>
            <div className="absolute top-4 left-4">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Giảm 20%
              </span>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Áo Thun Graphic Neon
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center text-yellow-400 gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
                <Star className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                4.8 (124 đánh giá)
              </span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-primary">
                {formatPrice(299900)}
              </p>
              <p className="text-xl text-slate-400 line-through mb-1">
                {formatPrice(375000)}
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>

          {/* Color Selection */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Màu sắc:{" "}
              <span className="text-slate-500 font-normal">
                {COLORS[selectedColor].name}
              </span>
            </h3>
            <div className="flex items-center gap-3">
              {COLORS.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(index)}
                  className={`w-10 h-10 rounded-full ${color.value} border shadow-sm hover:scale-105 transition-transform ${
                    selectedColor === index
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark"
                      : "border-slate-200 dark:border-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Kích cỡ:{" "}
                <span className="text-slate-500 font-normal">
                  {selectedSize}
                </span>
              </h3>
              <button className="text-sm font-medium text-primary hover:text-orange-600 underline decoration-dashed underline-offset-4">
                Hướng dẫn chọn size
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={size === "XL"}
                  className={`h-12 rounded-lg font-medium transition-colors ${
                    selectedSize === size
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent font-bold shadow-lg shadow-slate-200 dark:shadow-none"
                      : "border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-4">
              {/* Quantity Stepper */}
              <div className="flex items-center h-14 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 w-32">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  className="flex-1 w-full text-center bg-transparent border-none text-slate-900 dark:text-white font-semibold focus:ring-0 p-0"
                  readOnly
                  type="text"
                  value={quantity}
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button className="flex-1 h-14 bg-primary hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Thêm vào giỏ hàng
              </button>

              {/* Wishlist */}
              <button className="h-14 w-14 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 bg-white dark:bg-slate-800 transition-colors group">
                <Heart className="w-5 h-5 group-hover:fill-current" />
              </button>
            </div>

            <button className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">
              Mua ngay
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Miễn phí vận chuyển
                </p>
                <p className="text-xs text-slate-500">Đơn hàng trên 500k</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Thanh toán an toàn
                </p>
                <p className="text-xs text-slate-500">Bảo mật 100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <div className="mt-20">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {[
              { id: "description", label: "Mô tả" },
              { id: "material", label: "Chất liệu & Bảo quản" },
              { id: "shipping", label: "Vận chuyển & Đổi trả" },
              { id: "reviews", label: "Đánh giá (124)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8 text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
          {activeTab === "description" && (
            <>
              <p className="mb-4">
                Nâng tầm phong cách hàng ngày của bạn với Áo Thun Graphic Neon
                của chúng tôi. Được thiết kế dành cho những người táo bạo và đầy
                sức sống, chiếc áo này có họa tiết in neon nổi bật trên nền vải
                cotton cao cấp. Dù bạn đang dạo phố hay thư giãn tại nhà, form
                dáng thoải mái đảm bảo sự thoải mái tối đa mà không làm giảm
                phong cách.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Vải cotton jersey 100% cao cấp mềm mại và thoáng khí.</li>
                <li>Cổ tròn gân giữ form sau khi giặt.</li>
                <li>Đường may kép ở tay áo và viền dưới để tăng độ bền.</li>
                <li>Form dáng hiện đại thoải mái, chuẩn size.</li>
              </ul>
            </>
          )}
          {activeTab === "material" && (
            <div>
              <p className="mb-4">
                <strong>Chất liệu:</strong> Cotton 100%
              </p>
              <p className="mb-4">
                <strong>Hướng dẫn bảo quản:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Giặt máy ở nhiệt độ thấp</li>
                <li>Không sử dụng chất tẩy</li>
                <li>Phơi khô tự nhiên</li>
                <li>Ủi ở nhiệt độ thấp nếu cần</li>
              </ul>
            </div>
          )}
          {activeTab === "shipping" && (
            <div>
              <p className="mb-4">
                <strong>Thời gian vận chuyển:</strong> 2-5 ngày làm việc
              </p>
              <p className="mb-4">
                <strong>Chính sách đổi trả:</strong> Đổi trả miễn phí trong vòng
                30 ngày nếu sản phẩm còn nguyên tem mác và chưa qua sử dụng.
              </p>
            </div>
          )}
          {activeTab === "reviews" && (
            <div>
              <p>Phần đánh giá sẽ được cập nhật sớm...</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16 mb-20">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          Bạn cũng có thể thích
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {RELATED_PRODUCTS.map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 relative">
                <img
                  alt={product.name}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  src={product.image}
                />
                {product.badge && (
                  <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                    {product.badge}
                  </div>
                )}
                <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    <Link href={`/detail/${product.id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{product.color}</p>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

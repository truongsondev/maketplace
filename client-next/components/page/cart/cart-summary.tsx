import Link from "next/link";
import type { CartData } from "@/services/cart.service";

interface CartSummaryProps {
  cart: CartData;
  onCheckout: () => void;
  checkoutLoading: boolean;
  checkoutDisabled?: boolean;
  selectedCount: number;
  effectiveSubtotal: number;
  hasSelection: boolean;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function CartSummary({
  cart,
  onCheckout,
  checkoutLoading,
  checkoutDisabled = false,
  selectedCount,
  effectiveSubtotal,
  hasSelection,
}: CartSummaryProps) {
  const discount = 0;
  const shippingFee = 0;
  const taxes = 0;
  const total = Math.max(
    effectiveSubtotal + shippingFee + taxes - discount,
    0,
  );

  return (
    <aside className="rounded-none lg:rounded-2xl border-l lg:border border-slate-200 dark:border-slate-700 bg-transparent lg:bg-white dark:lg:bg-slate-900 p-5 md:p-6">
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
        Thanh toán
      </h2>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {hasSelection
          ? `Bạn đang thanh toán ${selectedCount} sản phẩm đã chọn.`
          : "Bạn đang thanh toán toàn bộ giỏ hàng."}
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Sản phẩm trong giỏ</span>
          <span className="font-semibold">{cart.totalItems} sản phẩm</span>
        </div>
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Sản phẩm đang thanh toán</span>
          <span className="font-semibold">
            {hasSelection ? `${selectedCount} sản phẩm` : "Toàn bộ"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Tạm tính</span>
          <span className="font-semibold">{formatPrice(effectiveSubtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Phí vận chuyển (ước tính)</span>
          <span className="font-semibold">{formatPrice(shippingFee)}</span>
        </div>
        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between text-primary">
          <span>Thuế</span>
          <span className="font-semibold">+{formatPrice(taxes)}</span>
        </div>
        <div className="flex items-center justify-between text-primary">
          <span>Giảm giá</span>
          <span className="font-semibold">-{formatPrice(discount)}</span>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between text-slate-900 dark:text-white">
          <span className="font-semibold">Tổng thanh toán</span>
          <span className="text-xl font-bold">{formatPrice(total)}</span>
        </div>

        <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5 flex items-center gap-2 opacity-60">
          <input
            type="text"
            placeholder="Mã giảm giá (sắp có)"
            disabled
            className="flex-1 h-9 bg-transparent px-3 text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
          <button
            disabled
            className="h-9 px-4 rounded-full bg-primary text-white text-xs font-bold"
          >
            ÁP DỤNG
          </button>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={checkoutLoading || checkoutDisabled}
        className="mt-5 w-full h-12 rounded-full bg-primary text-white font-bold tracking-wide hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checkoutLoading ? "ĐANG XỬ LÝ..." : "THANH TOÁN VNPAY"}
      </button>

      <button
        disabled
        className="mt-3 w-full h-11 rounded-full border border-primary/40 text-primary font-semibold opacity-60"
      >
        THANH TOÁN THÀNH VIÊN (SẮP CÓ)
      </button>

      <Link
        href="/"
        className="mt-4 block text-center text-xs text-slate-500 hover:text-primary transition-colors"
      >
        Tiếp tục mua sắm
      </Link>
    </aside>
  );
}

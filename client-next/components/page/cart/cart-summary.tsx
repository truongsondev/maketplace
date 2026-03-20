import Link from "next/link";
import type { CartData } from "@/services/cart.service";

interface CartSummaryProps {
  cart: CartData;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function CartSummary({ cart }: CartSummaryProps) {
  const discount = 0;
  const shippingFee = 0;
  const taxes = 0;
  const total = Math.max(cart.totalAmount + shippingFee + taxes - discount, 0);

  return (
    <aside className="rounded-none lg:rounded-2xl border-l lg:border border-slate-200 dark:border-slate-700 bg-transparent lg:bg-white dark:lg:bg-slate-900 p-5 md:p-6">
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
        Summary
      </h2>

      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Total items</span>
          <span className="font-semibold">{cart.totalItems} Items</span>
        </div>
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Sub total</span>
          <span className="font-semibold">{formatPrice(cart.totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Est. Delivery</span>
          <span className="font-semibold">{formatPrice(shippingFee)}</span>
        </div>
        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between text-primary">
          <span>Taxes</span>
          <span className="font-semibold">+{formatPrice(taxes)}</span>
        </div>
        <div className="flex items-center justify-between text-primary">
          <span>Discount</span>
          <span className="font-semibold">-{formatPrice(discount)}</span>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between text-slate-900 dark:text-white">
          <span className="font-semibold">Final payment</span>
          <span className="text-xl font-bold">{formatPrice(total)}</span>
        </div>

        <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5 flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            className="flex-1 h-9 bg-transparent px-3 text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
          <button className="h-9 px-4 rounded-full bg-primary text-white text-xs font-bold hover:bg-orange-600 transition-colors">
            APPLY
          </button>
        </div>
      </div>

      <button className="mt-5 w-full h-12 rounded-full bg-primary text-white font-bold tracking-wide hover:bg-orange-600 transition-colors">
        CHECKOUT
      </button>

      <button className="mt-3 w-full h-11 rounded-full border border-primary/40 text-primary font-semibold hover:bg-primary/5 transition-colors">
        MEMBER CHECKOUT
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

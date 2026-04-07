"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/hooks/use-cart";
import { useMyAddresses } from "@/hooks/use-addresses";
import { useCreatePayosPaymentLink } from "@/hooks/use-payos-payment";
import type { CartItem } from "@/services/cart.service";
import type { UserAddress } from "@/types/address.types";
import {
  voucherService,
  type VoucherValidationResult,
} from "@/services/voucher.service";
import type { ApiErrorResponse } from "@/types/api.types";

type PaymentMethod = "PAYOS" | "MOMO";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function buildAddressLabel(address: UserAddress): string {
  const parts = [
    address.addressLine,
    address.ward,
    address.district,
    address.city,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.join(", ");
}

function normalizePhone(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

export function CheckoutConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    data: cart,
    isLoading: isCartLoading,
    isError: isCartError,
  } = useCart();
  const {
    data: addresses,
    isLoading: isAddressesLoading,
    isError: isAddressesError,
  } = useMyAddresses();

  const payosMutation = useCreatePayosPaymentLink();

  const selectedItemIds = useMemo(() => {
    const raw = searchParams.get("items");
    if (!raw) return [];
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const itemsToPay: CartItem[] = useMemo(() => {
    if (!cart) return [];
    if (selectedItemIds.length === 0) return cart.items;
    return cart.items.filter((item) => selectedItemIds.includes(item.itemId));
  }, [cart, selectedItemIds]);

  const subtotalAmount = useMemo(() => {
    return itemsToPay.reduce((sum, item) => sum + item.subtotal, 0);
  }, [itemsToPay]);

  const [voucherCode, setVoucherCode] = useState<string>("");
  const [voucherResult, setVoucherResult] =
    useState<VoucherValidationResult | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  const discountAmount = voucherResult?.pricing.discountAmount ?? 0;
  const totalAmount = voucherResult?.pricing.finalTotal ?? subtotalAmount;

  const defaultAddressId = useMemo(() => {
    const list = addresses ?? [];
    const def = list.find((a) => a.isDefault);
    return (def ?? list[0])?.id ?? "";
  }, [addresses]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [manualAddressLine, setManualAddressLine] = useState<string>("");
  const [manualWard, setManualWard] = useState<string>("");
  const [manualDistrict, setManualDistrict] = useState<string>("");
  const [manualCity, setManualCity] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYOS");

  const activeAddressId = selectedAddressId || defaultAddressId;

  const selectedAddress = useMemo(() => {
    if (!addresses || !activeAddressId) return null;
    return addresses.find((a) => a.id === activeAddressId) ?? null;
  }, [activeAddressId, addresses]);

  useEffect(() => {
    if (!isAddressesError) return;
    toast.error("Không thể tải danh sách địa chỉ", {
      description: "Vui lòng thử lại hoặc nhập địa chỉ thủ công.",
    });
  }, [isAddressesError]);

  useEffect(() => {
    if (!isCartError) return;
    toast.error("Không thể tải giỏ hàng", {
      description: "Vui lòng quay lại giỏ hàng và thử lại.",
    });
  }, [isCartError]);

  useEffect(() => {
    setVoucherResult(null);
  }, [selectedItemIds, cart?.cartId]);

  const canSubmit = itemsToPay.length > 0 && totalAmount > 0;

  const handleApplyVoucher = async () => {
    const normalizedCode = voucherCode.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }

    try {
      setIsValidatingVoucher(true);
      const result = await voucherService.validateVoucher({
        code: normalizedCode,
        cartItemIds: itemsToPay.map((item) => item.itemId),
      });
      setVoucherCode(result.voucher.code);
      setVoucherResult(result);
      toast.success(`Đã áp dụng voucher ${result.voucher.code}`);
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      setVoucherResult(null);
      toast.error("Không thể áp dụng voucher", {
        description: apiError?.error?.message ?? "Vui lòng kiểm tra lại mã.",
      });
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const clearVoucher = () => {
    setVoucherResult(null);
    setVoucherCode("");
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Không có sản phẩm để thanh toán");
      return;
    }

    const name = (recipientName || selectedAddress?.recipient || "").trim();
    const phone = normalizePhone(
      recipientPhone || selectedAddress?.phone || "",
    );

    const addressLine = (
      manualAddressLine ||
      selectedAddress?.addressLine ||
      ""
    ).trim();
    const ward = (manualWard || selectedAddress?.ward || "").trim();
    const district = (manualDistrict || selectedAddress?.district || "").trim();
    const city = (manualCity || selectedAddress?.city || "").trim();

    if (!name) {
      toast.error("Vui lòng nhập tên người nhận");
      return;
    }

    if (!phone || phone.length < 8) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }

    if (!addressLine || !ward || !district || !city) {
      toast.error("Vui lòng nhập đầy đủ địa chỉ giao hàng");
      return;
    }

    if (paymentMethod === "MOMO") {
      toast.message("MoMo chưa được tích hợp", {
        description: "Vui lòng chọn PayOS (ngân hàng) để thanh toán.",
      });
      return;
    }

    const description = `TT ${itemsToPay.length} san pham`;

    payosMutation.mutate(
      {
        amount: totalAmount,
        description,
        voucherCode: voucherResult?.voucher.code,
        cartItemIds: itemsToPay.map((item) => item.itemId),
      },
      {
        onSuccess: (result) => {
          try {
            const payload = {
              orderId: result.orderId,
              orderCode: result.orderCode,
              amount: totalAmount,
              pricing: {
                subtotalAmount,
                discountAmount,
                totalAmount,
                voucherCode: voucherResult?.voucher.code ?? null,
              },
              items: itemsToPay.map((item) => ({
                itemId: item.itemId,
                productId: item.productId,
                productName: item.productName,
                variantId: item.variantId,
                variantSku: item.variantSku,
                variantAttributes: item.variantAttributes,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                image: item.image ?? null,
              })),
              shipping: {
                recipient: name,
                phone,
                addressLine,
                ward,
                district,
                city,
                addressId: activeAddressId || null,
              },
              payment: {
                method: paymentMethod,
              },
              createdAt: new Date().toISOString(),
            };

            sessionStorage.setItem(
              `checkout:${result.orderCode}`,
              JSON.stringify(payload),
            );
            sessionStorage.setItem("checkout:lastOrderCode", result.orderCode);
          } catch {
            // ignore storage errors
          }

          window.location.href = result.checkoutUrl;
        },
      },
    );
  };

  if (isCartLoading || isAddressesLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <Loader2 className="mx-auto size-8 animate-spin text-neutral-700 dark:text-neutral-200" />
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            Đang tải thông tin đơn hàng...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Xác nhận đơn hàng
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Kiểm tra thông tin giao hàng và chọn phương thức thanh toán.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Địa chỉ nhận hàng
            </h2>

            {addresses && addresses.length > 0 ? (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Chọn địa chỉ đã lưu
                </label>
                <select
                  value={activeAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.recipient} - {addr.phone} -{" "}
                      {buildAddressLabel(addr)}
                      {addr.isDefault ? " (Mặc định)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                Chưa có địa chỉ đã lưu. Vui lòng nhập địa chỉ bên dưới.
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Tên người nhận
                </label>
                <input
                  value={recipientName || selectedAddress?.recipient || ""}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Số điện thoại
                </label>
                <input
                  value={recipientPhone || selectedAddress?.phone || ""}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  placeholder="0123456789"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Địa chỉ
                </label>
                <input
                  value={
                    manualAddressLine || selectedAddress?.addressLine || ""
                  }
                  onChange={(e) => setManualAddressLine(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  placeholder="Số nhà, tên đường..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Phường/Xã
                </label>
                <input
                  value={manualWard || selectedAddress?.ward || ""}
                  onChange={(e) => setManualWard(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Quận/Huyện
                </label>
                <input
                  value={manualDistrict || selectedAddress?.district || ""}
                  onChange={(e) => setManualDistrict(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Tỉnh/Thành phố
                </label>
                <input
                  value={manualCity || selectedAddress?.city || ""}
                  onChange={(e) => setManualCity(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Phương thức thanh toán
            </h2>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "PAYOS"}
                  onChange={() => setPaymentMethod("PAYOS")}
                />
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    PayOS (Ngân hàng)
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Thanh toán qua QR/Internet Banking.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "MOMO"}
                  onChange={() => setPaymentMethod("MOMO")}
                />
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    MoMo
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Chưa tích hợp trong phiên bản hiện tại.
                  </p>
                </div>
              </label>
            </div>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Voucher
            </h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá"
                className="h-11 flex-1 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
              <button
                onClick={handleApplyVoucher}
                disabled={isValidatingVoucher || itemsToPay.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 px-4 font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-100"
              >
                {isValidatingVoucher ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
              {voucherResult && (
                <button
                  onClick={clearVoucher}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 px-4 font-semibold text-red-600 hover:bg-red-50"
                >
                  Bỏ mã
                </button>
              )}
            </div>
            {voucherResult && (
              <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                Áp dụng thành công {voucherResult.voucher.code}: giảm{" "}
                {formatPrice(discountAmount)}
              </p>
            )}
          </article>
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Thông tin đơn hàng
            </h2>

            <div className="mt-4 space-y-3">
              {itemsToPay.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900 dark:text-white">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">
                      SL: {item.quantity}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-neutral-900 dark:text-white">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                <p>Tạm tính</p>
                <p>{formatPrice(subtotalAmount)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                <p>Giảm giá</p>
                <p>-{formatPrice(discountAmount)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Tổng thanh toán
                </p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {formatPrice(totalAmount)}
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || payosMutation.isPending}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-5 font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payosMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Đang chuyển sang thanh toán...
                </span>
              ) : (
                "Thanh toán"
              )}
            </button>

            <div className="mt-3 flex items-center justify-between text-sm">
              <Link
                href="/cart"
                className="text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
              >
                Quay lại giỏ hàng
              </Link>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}

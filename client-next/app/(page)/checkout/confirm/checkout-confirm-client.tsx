"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { useCart } from "@/hooks/use-cart";
import { useMyAddresses } from "@/hooks/use-addresses";
import { useCreatePayosPaymentLink } from "@/hooks/use-payos-payment";
import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import type { CartItem } from "@/services/cart.service";
import type { UserAddress } from "@/types/address.types";
import { addressService } from "@/services/address.service";
import { locationService } from "@/services/location.service";
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

  const [isDark, setIsDark] = useState(false);

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

  const lastUsedAddressQuery = useQuery({
    queryKey: ["addresses", "last-used"],
    queryFn: () => addressService.getLastUsedAddress(),
    retry: false,
  });

  const payosMutation = useCreatePayosPaymentLink();

  const cartCount = cart?.totalItems ?? 0;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const selectedItemIds = useMemo(() => {
    const raw = searchParams.get("items");
    if (!raw) return [];
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const voucherFromQuery = useMemo(() => {
    const raw = searchParams.get("voucher");
    return raw?.trim() ? raw.trim() : "";
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
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | "">(
    "",
  );
  const [selectedWardCode, setSelectedWardCode] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYOS");

  const activeAddressId = selectedAddressId || defaultAddressId;

  const selectedAddress = useMemo(() => {
    if (!addresses || !activeAddressId) return null;
    return addresses.find((a) => a.id === activeAddressId) ?? null;
  }, [activeAddressId, addresses]);

  const provincesQuery = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: () => locationService.getProvinces(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const wardsQuery = useQuery({
    queryKey: ["locations", "wards", selectedProvinceCode],
    queryFn: () =>
      locationService.getWardsByProvince(Number(selectedProvinceCode)),
    enabled: selectedProvinceCode !== "",
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const selectedProvince = useMemo(() => {
    if (!provincesQuery.data || selectedProvinceCode === "") return null;
    return (
      provincesQuery.data.find((p) => p.code === selectedProvinceCode) ?? null
    );
  }, [provincesQuery.data, selectedProvinceCode]);

  const selectedWard = useMemo(() => {
    if (!wardsQuery.data || selectedWardCode === "") return null;
    return wardsQuery.data.find((w) => w.code === selectedWardCode) ?? null;
  }, [selectedWardCode, wardsQuery.data]);

  useEffect(() => {
    const lastUsed = lastUsedAddressQuery.data;
    if (!lastUsed) return;

    // Prefer selecting the last-used address if it exists in DB list.
    if (addresses && addresses.length > 0) {
      const exists = addresses.some((a) => a.id === lastUsed.id);
      if (exists) {
        setSelectedAddressId(lastUsed.id);
      }
      return;
    }

    // If user has no saved addresses, prefill manual form using last-used cache.
    setRecipientName(lastUsed.recipient);
    setRecipientPhone(lastUsed.phone);
    setManualAddressLine(lastUsed.addressLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUsedAddressQuery.data, addresses?.length]);

  const baseCityName = useMemo(() => {
    if (selectedAddress?.city) return selectedAddress.city;
    return lastUsedAddressQuery.data?.city ?? "";
  }, [lastUsedAddressQuery.data?.city, selectedAddress?.city]);

  const baseWardName = useMemo(() => {
    if (selectedAddress?.ward) return selectedAddress.ward;
    return lastUsedAddressQuery.data?.ward ?? "";
  }, [lastUsedAddressQuery.data?.ward, selectedAddress?.ward]);

  useEffect(() => {
    if (selectedProvinceCode !== "") return;
    const cityName = baseCityName.trim();
    if (!cityName) return;
    const provinces = provincesQuery.data;
    if (!provinces || provinces.length === 0) return;

    const matched = provinces.find((p) => p.name === cityName);
    if (matched) {
      setSelectedProvinceCode(matched.code);
    }
  }, [baseCityName, provincesQuery.data, selectedProvinceCode]);

  useEffect(() => {
    if (selectedWardCode !== "") return;
    const wardName = baseWardName.trim();
    if (!wardName) return;
    const wards = wardsQuery.data;
    if (!wards || wards.length === 0) return;

    const matched = wards.find((w) => w.name === wardName);
    if (matched) {
      setSelectedWardCode(matched.code);
    }
  }, [baseWardName, selectedWardCode, wardsQuery.data]);

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

  useEffect(() => {
    if (!voucherFromQuery) return;
    setVoucherCode(voucherFromQuery.toUpperCase());
  }, [voucherFromQuery]);

  const canSubmit = itemsToPay.length > 0 && totalAmount > 0;

  const applyVoucher = async (params: {
    code: string;
    withToast?: boolean;
  }) => {
    const normalizedCode = params.code.trim().toUpperCase();
    if (!normalizedCode) {
      if (params.withToast) toast.error("Vui lòng nhập mã voucher");
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
      if (params.withToast) {
        toast.success(`Đã áp dụng voucher ${result.voucher.code}`);
      }
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      setVoucherResult(null);
      if (params.withToast) {
        toast.error("Không thể áp dụng voucher", {
          description: apiError?.error?.message ?? "Vui lòng kiểm tra lại mã.",
        });
      }
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  useEffect(() => {
    if (!voucherFromQuery) return;
    if (!cart?.cartId) return;
    if (itemsToPay.length === 0) return;
    if (voucherResult?.voucher.code) return;

    void applyVoucher({ code: voucherFromQuery, withToast: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucherFromQuery, cart?.cartId, itemsToPay.length]);

  const handleApplyVoucher = async () => {
    await applyVoucher({ code: voucherCode, withToast: true });
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

    const city = (selectedProvince?.name || selectedAddress?.city || "").trim();
    const ward = (selectedWard?.name || selectedAddress?.ward || "").trim();
    const district = (() => {
      const addrDistrict = selectedAddress?.district?.trim() || "";
      const addrWard = selectedAddress?.ward?.trim() || "";
      const addrCity = selectedAddress?.city?.trim() || "";
      if (
        selectedAddress &&
        ward === addrWard &&
        city === addrCity &&
        addrDistrict
      ) {
        return addrDistrict;
      }
      return ward;
    })();

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

    const description = `TT ${itemsToPay.length} sản phẩm`;

    payosMutation.mutate(
      {
        amount: totalAmount,
        description,
        voucherCode: voucherResult?.voucher.code,
        cartItemIds: itemsToPay.map((item) => item.itemId),
        shipping: {
          recipient: name,
          phone,
          addressLine,
          ward,
          district,
          city,
          addressId: selectedAddress?.id ?? null,
        },
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
      <div className="luxury-page flex min-h-screen flex-col overflow-x-hidden transition-colors duration-200">
        <Header
          isDark={isDark}
          onToggleDarkMode={() => setIsDark((prev) => !prev)}
          cartCount={cartCount}
          variant="solid"
        />
        <main className="flex-1">
          <div className="luxury-container pb-16 pt-10">
            <div className="luxury-panel p-10 text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-text-muted">
                Đang tải thông tin đơn hàng...
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="luxury-page flex min-h-screen flex-col overflow-x-hidden transition-colors duration-200">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
        variant="solid"
      />

      <main className="flex-1">
        <div className="luxury-container pb-20 pt-34">
          <header className="mb-8">
            <p className="luxury-eyebrow">Thanh toán an toàn</p>
            <h1 className="luxury-title mt-4">Thanh toán tinh gọn</h1>
            <p className="luxury-copy mt-4 max-w-2xl">
              Hoàn tất đơn hàng trong một không gian yên tĩnh: địa chỉ rõ ràng,
              thanh toán bảo mật và tóm tắt shopping bag luôn ở bên cạnh.
            </p>
            <div className="mt-7 grid gap-px bg-black/10 text-xs uppercase tracking-[0.18em] text-neutral-600 dark:bg-white/10 dark:text-neutral-300 sm:grid-cols-3">
              {[
                "Kiểm tra giỏ hàng",
                "Cập nhật giao hàng",
                "Thanh toán an toàn",
              ].map((step, index) => (
                <div
                  key={step}
                  className="bg-[#f7f3ec] px-4 py-3 dark:bg-neutral-950"
                >
                  <span className="mr-3 text-neutral-400">0{index + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </header>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <article className="border-y border-black/10 py-6 dark:border-white/10 sm:py-8">
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold uppercase tracking-[-0.02em] text-neutral-900 dark:text-white">
                    Địa chỉ giao hàng
                  </h2>
                  <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    Chọn địa chỉ quen thuộc hoặc nhập mới. Chúng tôi giữ phần
                    thanh toán tối giản để bạn chỉ tập trung vào đơn hàng.
                  </p>

                  {addresses && addresses.length > 0 ? (
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        Chọn địa chỉ đã lưu
                      </label>
                      <select
                        value={activeAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="luxury-field mt-2 h-12 w-full py-0"
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
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        Họ và tên
                      </label>
                      <input
                        value={
                          recipientName || selectedAddress?.recipient || ""
                        }
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="luxury-field mt-2 h-12 w-full py-0"
                        placeholder="Họ và tên"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        Số điện thoại
                      </label>
                      <input
                        value={recipientPhone || selectedAddress?.phone || ""}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="luxury-field mt-2 h-12 w-full py-0"
                        placeholder="Số điện thoại"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      Địa chỉ chi tiết
                    </label>
                    <input
                      value={
                        manualAddressLine || selectedAddress?.addressLine || ""
                      }
                      onChange={(e) => setManualAddressLine(e.target.value)}
                      className="luxury-field mt-2 h-12 w-full py-0"
                      placeholder="Số nhà, tên đường..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        Tỉnh/Thành phố
                      </label>
                      <select
                        value={
                          selectedProvinceCode === ""
                            ? ""
                            : String(selectedProvinceCode)
                        }
                        onChange={(e) => {
                          const next = e.target.value
                            ? Number(e.target.value)
                            : "";
                          setSelectedProvinceCode(next);
                          setSelectedWardCode("");
                        }}
                        disabled={
                          provincesQuery.isLoading || provincesQuery.isError
                        }
                        className="luxury-field mt-2 h-12 w-full py-0 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {(provincesQuery.data ?? []).map((p) => (
                          <option key={p.code} value={String(p.code)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        Phường/Xã
                      </label>
                      <select
                        value={
                          selectedWardCode === ""
                            ? ""
                            : String(selectedWardCode)
                        }
                        onChange={(e) =>
                          setSelectedWardCode(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        disabled={
                          selectedProvinceCode === "" ||
                          wardsQuery.isLoading ||
                          wardsQuery.isError
                        }
                        className="luxury-field mt-2 h-12 w-full py-0 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Chọn phường/xã</option>
                        {(wardsQuery.data ?? []).map((w) => (
                          <option key={w.code} value={String(w.code)}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <div className="my-8 border-t border-black/10 dark:border-white/10" />

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold uppercase tracking-[-0.02em] text-neutral-900 dark:text-white">
                    Thanh toán
                  </h2>
                  <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    Giao dịch được chuyển qua cổng thanh toán bảo mật. AURA
                    không lưu thông tin ngân hàng của bạn.
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between gap-3 border border-black/10 px-4 py-3 text-sm dark:border-white/10">
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "PAYOS"}
                          onChange={() => setPaymentMethod("PAYOS")}
                        />
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          PayOS (QR/Ngân hàng)
                        </span>
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Chuyển hướng
                      </span>
                    </label>
                  </div>
                </section>
              </article>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <article className="border-y border-black/10 py-6 dark:border-white/10 sm:py-8">
                <h2 className="text-xl font-semibold uppercase tracking-[-0.02em] text-neutral-900 dark:text-white">
                  Tổng kết đơn hàng
                </h2>

                <div className="mt-5 space-y-4">
                  {itemsToPay.map((item) => (
                    <div key={item.itemId} className="flex items-start gap-4">
                      <div className="relative size-12 overflow-hidden border border-black/10 bg-neutral-50 dark:border-white/10 dark:bg-neutral-950">
                        {item.image?.url ? (
                          <Image
                            src={item.image.url}
                            alt={item.image.altText || item.productName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          SL: {item.quantity}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-white">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="my-8 border-t border-neutral-200 dark:border-neutral-800" />

                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Mã khuyến mãi
                  </h3>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <input
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã giảm giá"
                      className="luxury-field h-12 w-full py-0 sm:flex-1"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      disabled={
                        isValidatingVoucher ||
                        itemsToPay.length === 0 ||
                        voucherCode.trim().length === 0
                      }
                      className="luxury-button-ghost h-12 w-full px-4 py-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-28"
                    >
                      {isValidatingVoucher ? "..." : "Áp dụng"}
                    </button>
                    {voucherResult ? (
                      <button
                        onClick={clearVoucher}
                        className="h-12 w-full border border-red-200 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30 sm:w-auto"
                      >
                        Bỏ mã
                      </button>
                    ) : null}
                  </div>
                  {voucherResult && (
                    <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Đã áp dụng {voucherResult.voucher.code}: -
                      {formatPrice(discountAmount)}
                    </p>
                  )}
                </div>

                <div className="my-8 border-t border-neutral-200 dark:border-neutral-800" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-200">
                    <span className="font-semibold">Tạm tính</span>
                    <span className="font-semibold">
                      {formatPrice(subtotalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-200">
                    <span className="font-semibold">Phí giao hàng</span>
                    <span className="font-semibold">{formatPrice(0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-200">
                    <span className="font-semibold">Giảm giá</span>
                    <span className="font-semibold">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                </div>

                <div className="my-8 border-t border-neutral-200 dark:border-neutral-800" />

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      Tổng thanh toán
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-3xl font-semibold leading-none text-neutral-900 dark:text-white">
                    {formatPrice(totalAmount)}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || payosMutation.isPending}
                  className="luxury-button mt-5 h-12 w-full whitespace-nowrap px-6 py-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {payosMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang chuyển sang thanh toán...
                    </span>
                  ) : (
                    `Hoàn tất ${formatPrice(totalAmount)}`
                  )}
                </button>

                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Thanh toán an toàn - không lưu dữ liệu ngân hàng
                </div>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <Link
                    href="/cart"
                    className="font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                  >
                    Quay lại giỏ hàng
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              </article>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

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
      <div className="bg-background-light dark:bg-background-dark text-neutral-800 dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
        <Header
          isDark={isDark}
          onToggleDarkMode={() => setIsDark((prev) => !prev)}
          cartCount={cartCount}
        />
        <main className="flex-1 bg-[#f5f5f5] text-[#222222] dark:bg-neutral-950 dark:text-neutral-100">
          <div className="mx-auto w-full max-w-330 px-4 pb-16 pt-10 md:px-6 lg:px-8">
            <div className="rounded-3xl border border-border-color bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
    <div className="bg-background-light dark:bg-background-dark text-neutral-800 dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
      />

      <main className="flex-1 bg-[#f5f5f5] text-[#222222] dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto w-full max-w-330 px-4 pb-16 pt-10 md:px-6 lg:px-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
              Thanh toán
            </h1>
          </header>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <article className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Thông tin thanh toán
                  </h2>

                  {addresses && addresses.length > 0 ? (
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        Chọn địa chỉ đã lưu
                      </label>
                      <select
                        value={activeAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mt-2 h-12 w-full rounded-sm border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
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
                        className="mt-2 h-12 w-full rounded-sm border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
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
                        className="mt-2 h-12 w-full rounded-sm border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
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
                      className="mt-2 h-12 w-full rounded-sm border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
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
                        className="mt-2 h-12 w-full rounded-sm border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
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
                        className="mt-2 h-12 w-full rounded-sm border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
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

                <div className="my-8 border-t border-neutral-200 dark:border-neutral-800" />

                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Phương thức thanh toán
                  </h2>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between gap-3 rounded-sm border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
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

                    <label className="flex items-center justify-between gap-3 rounded-sm border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "MOMO"}
                          onChange={() => setPaymentMethod("MOMO")}
                        />
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          MoMo
                        </span>
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Sắp có
                      </span>
                    </label>
                  </div>
                </section>
              </article>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <article className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Tóm tắt đơn hàng
                </h2>

                <div className="mt-5 space-y-4">
                  {itemsToPay.map((item) => (
                    <div key={item.itemId} className="flex items-start gap-4">
                      <div className="relative size-12 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
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
                      className="h-12 w-full rounded-sm border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 sm:flex-1"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      disabled={
                        isValidatingVoucher ||
                        itemsToPay.length === 0 ||
                        voucherCode.trim().length === 0
                      }
                      className="h-12 w-full rounded-sm bg-neutral-200 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 sm:w-28"
                    >
                      {isValidatingVoucher ? "..." : "Apply"}
                    </button>
                    {voucherResult ? (
                      <button
                        onClick={clearVoucher}
                        className="h-12 w-full rounded-sm border border-red-200 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30 sm:w-auto"
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
                  <div className="whitespace-nowrap text-right text-3xl font-black leading-none text-neutral-900 dark:text-white">
                    {formatPrice(totalAmount)}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || payosMutation.isPending}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-sm bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {payosMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang chuyển sang thanh toán...
                    </span>
                  ) : (
                    `Thanh toán ${formatPrice(totalAmount)}`
                  )}
                </button>

                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Thanh toán an toàn - Mã hóa SSL
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

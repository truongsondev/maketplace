import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Header, Sidebar } from "@/components/admin";
import { physicalSaleService } from "@/services/api";

type CatalogItem = {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, unknown>;
  price: string;
  imageUrl: string | null;
  sellableStock: number;
  product: { id: string; name: string; imageUrl: string | null };
};

type CatalogProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  variants: CatalogItem[];
  totalStock: number;
  minPrice: number;
  maxPrice: number;
};

type CartLine = CatalogItem & { quantity: number };
type Sale = {
  id: string;
  code: string;
  status: string;
  totalAmount: string;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    lineTotal: string;
  }>;
};

const formatMoney = (value: string | number) =>
  Number(value).toLocaleString("vi-VN") + "đ";

const variantLabel = (attributes: Record<string, unknown>) => {
  const values = Object.values(attributes).filter(
    (value) => value !== null && value !== undefined && String(value).trim(),
  );
  return values.length ? values.join(" / ") : "Mặc định";
};

export default function PhysicalSalesPage() {
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [variantModal, setVariantModal] = useState<CatalogProduct | null>(null);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart],
  );

  const products = useMemo<CatalogProduct[]>(() => {
    const map = new Map<string, CatalogProduct>();
    catalog.forEach((item) => {
      const productId = item.product.id || item.productId;
      const existing = map.get(productId);
      if (existing) {
        existing.variants.push(item);
        existing.totalStock += item.sellableStock;
        existing.minPrice = Math.min(existing.minPrice, Number(item.price));
        existing.maxPrice = Math.max(existing.maxPrice, Number(item.price));
        if (!existing.imageUrl && (item.product.imageUrl || item.imageUrl)) {
          existing.imageUrl = item.product.imageUrl || item.imageUrl;
        }
        return;
      }

      map.set(productId, {
        id: productId,
        name: item.product.name,
        imageUrl: item.product.imageUrl || item.imageUrl,
        variants: [item],
        totalStock: item.sellableStock,
        minPrice: Number(item.price),
        maxPrice: Number(item.price),
      });
    });
    return Array.from(map.values());
  }, [catalog]);

  const loadSales = async () => setSales(await physicalSaleService.list());

  useEffect(() => {
    void physicalSaleService
      .list()
      .then(setSales)
      .catch(() => toast.error("Không thể tải giao dịch tại quầy"));
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        void physicalSaleService
          .catalog(search)
          .then(setCatalog)
          .catch(() => toast.error("Không thể tải tồn kho")),
      250,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const add = (item: CatalogItem) =>
    setCart((current) => {
      const found = current.find((line) => line.id === item.id);
      if (found) {
        return current.map((line) =>
          line.id === item.id
            ? { ...line, quantity: Math.min(line.quantity + 1, item.sellableStock) }
            : line,
        );
      }
      return item.sellableStock > 0 ? [...current, { ...item, quantity: 1 }] : current;
    });

  const selectProduct = (product: CatalogProduct) => {
    const sellableVariants = product.variants.filter((item) => item.sellableStock > 0);
    if (sellableVariants.length === 0) return toast.error("Sản phẩm đã hết hàng");
    if (sellableVariants.length === 1) {
      add(sellableVariants[0]);
      return;
    }
    setVariantModal({ ...product, variants: sellableVariants });
  };

  const checkout = async () => {
    if (!cart.length) return toast.error("Giỏ tại quầy đang trống");
    try {
      await physicalSaleService.create({
        paymentMethod,
        items: cart.map((item) => ({ variantId: item.id, quantity: item.quantity })),
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success("Đã ghi nhận thanh toán tại cửa hàng");
      setCart([]);
      await loadSales();
    } catch {
      toast.error("Không thể tạo giao dịch; vui lòng kiểm tra tồn kho");
    }
  };

  const printReceipt = (sale: Sale) => {
    const popup = window.open("", "_blank", "width=520,height=720");
    if (!popup) return toast.error("Trình duyệt đang chặn cửa sổ in");
    popup.document.write(`<html><body><h2>AURA - Hóa đơn ${sale.code}</h2><p>${new Date(sale.createdAt).toLocaleString("vi-VN")}</p>${sale.items.map((item) => `<p>${item.productName} (${item.sku}) x${item.quantity}: ${Number(item.lineTotal).toLocaleString("vi-VN")}đ</p>`).join("")}<hr><h3>Tổng: ${Number(sale.totalAmount).toLocaleString("vi-VN")}đ</h3></body></html>`);
    popup.document.close();
    popup.print();
  };

  const cancelSale = async (sale: Sale) => {
    const reason = window.prompt(`Lý do hủy giao dịch ${sale.code}:`)?.trim();
    if (!reason) return;
    try {
      await physicalSaleService.cancel(sale.id, reason);
      toast.success("Đã hủy và phục hồi tồn kho");
      await loadSales();
    } catch {
      toast.error("Không thể hủy giao dịch");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">Bán tại cửa hàng</h1>
            <p className="text-sm text-slate-500">
              Tồn kho dùng chung với website và đã trừ reservation online.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <input
                className="w-full rounded-xl border p-3"
                placeholder="Tìm tên sản phẩm hoặc nhập/quét SKU"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="mt-4 max-h-96 space-y-2 overflow-auto pr-1">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-cyan-500"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          Ảnh
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      <b className="line-clamp-2">{product.name}</b>
                      <small className="block text-slate-500">
                        {product.variants.length} biến thể · Còn {product.totalStock}
                      </small>
                    </span>
                    <span className="text-right font-medium">
                      {product.minPrice === product.maxPrice
                        ? formatMoney(product.minPrice)
                        : `${formatMoney(product.minPrice)} - ${formatMoney(product.maxPrice)}`}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-bold">Giỏ tại quầy</h2>
              <div className="my-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="flex-1">
                      {item.product.name}
                      <small className="block text-slate-500">
                        {item.sku} · {variantLabel(item.attributes)}
                      </small>
                    </span>
                    <input
                      className="w-20 rounded-lg border p-2"
                      type="number"
                      min={1}
                      max={item.sellableStock}
                      value={item.quantity}
                      onChange={(e) =>
                        setCart((rows) =>
                          rows.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  quantity: Math.max(
                                    1,
                                    Math.min(item.sellableStock, Number(e.target.value)),
                                  ),
                                }
                              : row,
                          ),
                        )
                      }
                    />
                    <button
                      className="text-red-600"
                      onClick={() => setCart((rows) => rows.filter((row) => row.id !== item.id))}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng tiền</span>
                  <span>{total.toLocaleString("vi-VN")}đ</span>
                </div>
                <select
                  className="my-4 w-full rounded-xl border p-3"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="CARD">Thẻ</option>
                </select>
                <button
                  onClick={() => void checkout()}
                  className="w-full rounded-xl bg-slate-950 p-3 font-semibold text-white"
                >
                  Xác nhận đã thanh toán
                </button>
              </div>
            </section>
          </div>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">Giao dịch gần đây</h2>
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-t py-3">
                <span>
                  <b>{sale.code}</b>
                  <small className="block text-slate-500">
                    {new Date(sale.createdAt).toLocaleString("vi-VN")} · {sale.paymentMethod}
                  </small>
                </span>
                <span className="text-right">
                  {Number(sale.totalAmount).toLocaleString("vi-VN")}đ
                  <small className="block">{sale.status}</small>
                </span>
                <span className="flex gap-2">
                  <button className="rounded-lg border px-3 py-2" onClick={() => printReceipt(sale)}>
                    In hóa đơn
                  </button>
                  {sale.status === "COMPLETED" && (
                    <button
                      className="rounded-lg border border-red-300 px-3 py-2 text-red-700"
                      onClick={() => void cancelSale(sale)}
                    >
                      Hủy/hoàn
                    </button>
                  )}
                </span>
              </div>
            ))}
          </section>
        </div>
      </main>

      {variantModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center gap-4 border-b p-5">
              <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                {variantModal.imageUrl ? (
                  <img
                    src={variantModal.imageUrl}
                    alt={variantModal.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold">{variantModal.name}</h2>
                <p className="text-sm text-slate-500">Chọn biến thể để thêm vào giỏ</p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setVariantModal(null)}
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid max-h-100 gap-3 overflow-auto p-5 sm:grid-cols-2">
              {variantModal.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    add(variant);
                    setVariantModal(null);
                  }}
                  className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-cyan-500"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {(variant.imageUrl || variant.product.imageUrl) ? (
                      <img
                        src={variant.imageUrl || variant.product.imageUrl || ""}
                        alt={variant.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <span className="min-w-0 flex-1">
                    <b>{variantLabel(variant.attributes)}</b>
                    <small className="block text-slate-500">
                      {variant.sku} · Còn {variant.sellableStock}
                    </small>
                  </span>
                  <span className="font-medium">{formatMoney(variant.price)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

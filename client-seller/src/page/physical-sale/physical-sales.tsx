import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Header, Sidebar } from "@/components/admin";
import { physicalSaleService } from "@/services/api";

type CatalogItem = {
  id: string;
  sku: string;
  attributes: Record<string, unknown>;
  price: string;
  imageUrl: string | null;
  sellableStock: number;
  inventoryConsistent: boolean;
  product: { id: string; name: string; imageUrl: string | null };
};

type SaleItem = {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  imageUrl: string | null;
  variantAttributes: Record<string, unknown> | null;
};

type Sale = {
  id: string;
  code: string;
  status: "COMPLETED" | "CANCELLED";
  totalAmount: string;
  paymentMethod: string;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
  items: SaleItem[];
};

type CartLine = CatalogItem & { quantity: number };

const paymentLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  CARD: "Thẻ",
};

const formatMoney = (value: string | number) =>
  `${Number(value).toLocaleString("vi-VN")}đ`;

const variantLabel = (attributes?: Record<string, unknown> | null) => {
  const values = Object.values(attributes ?? {}).filter(
    (value) => value !== null && value !== undefined && String(value).trim(),
  );
  return values.length ? values.join(" / ") : "Mặc định";
};

const errorMessage = (error: unknown, fallback: string) => {
  const candidate = error as {
    message?: string;
    response?: { data?: { message?: string; error?: { message?: string } } };
  };
  return (
    candidate.response?.data?.error?.message ||
    candidate.response?.data?.message ||
    candidate.message ||
    fallback
  );
};

export default function PhysicalSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [productSearch, setProductSearch] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedSale = sales.find((sale) => sale.id === selectedId) ?? null;
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart],
  );

  const loadSales = async (query = search) => {
    try {
      setLoading(true);
      setSales((await physicalSaleService.list(query.trim())) as Sale[]);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể tải danh sách đơn vật lý"));
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async (query = productSearch) => {
    try {
      setCatalog((await physicalSaleService.catalog(query.trim())) as CatalogItem[]);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể tải danh sách sản phẩm"));
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSales(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!modalOpen) return;
    const timer = window.setTimeout(() => void loadCatalog(productSearch), 250);
    return () => window.clearTimeout(timer);
  }, [modalOpen, productSearch]);

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSale(null);
    setCart([]);
    setProductSearch("");
  };

  const openCreate = () => {
    setEditingSale(null);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("CASH");
    setCart([]);
    setProductSearch("");
    setModalOpen(true);
  };

  const openEdit = async () => {
    if (!selectedSale) return toast.error("Vui lòng chọn một đơn để sửa");
    if (selectedSale.status !== "COMPLETED") return toast.error("Không thể sửa đơn đã hủy");
    try {
      const rows = (await physicalSaleService.catalog("")) as CatalogItem[];
      setCatalog(rows);
      setEditingSale(selectedSale);
      setCustomerName(selectedSale.customerName ?? "");
      setCustomerPhone(selectedSale.customerPhone ?? "");
      setPaymentMethod(selectedSale.paymentMethod);
      setCart(
        selectedSale.items.map((item) => {
          const current = rows.find((row) => row.id === item.variantId);
          return {
            id: item.variantId,
            sku: item.sku,
            attributes: item.variantAttributes ?? {},
            price: item.unitPrice,
            imageUrl: item.imageUrl,
            sellableStock: (current?.sellableStock ?? 0) + item.quantity,
            inventoryConsistent: current?.inventoryConsistent ?? true,
            product: current?.product ?? {
              id: item.variantId,
              name: item.productName,
              imageUrl: item.imageUrl,
            },
            quantity: item.quantity,
          };
        }),
      );
      setModalOpen(true);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể mở đơn để sửa"));
    }
  };

  const addProduct = (item: CatalogItem) => {
    if (!item.inventoryConsistent) {
      return toast.error(`Tồn kho SKU ${item.sku} đang không nhất quán`);
    }
    if (item.sellableStock < 1) return toast.error("Sản phẩm đã hết hàng");
    setCart((rows) => {
      const found = rows.find((row) => row.id === item.id);
      if (!found) return [...rows, { ...item, quantity: 1 }];
      return rows.map((row) =>
        row.id === item.id
          ? { ...row, quantity: Math.min(row.quantity + 1, row.sellableStock) }
          : row,
      );
    });
  };

  const save = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      return toast.error("Vui lòng nhập họ tên và số điện thoại khách hàng");
    }
    if (!cart.length) return toast.error("Vui lòng thêm ít nhất một sản phẩm");
    try {
      setSaving(true);
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        items: cart.map((item) => ({ variantId: item.id, quantity: item.quantity })),
      };
      if (editingSale) {
        await physicalSaleService.update(editingSale.id, payload);
        toast.success("Đã cập nhật đơn vật lý");
      } else {
        await physicalSaleService.create({ ...payload, idempotencyKey: uuidv4() });
        toast.success("Đã tạo đơn vật lý");
      }
      setModalOpen(false);
      setEditingSale(null);
      setCart([]);
      setProductSearch("");
      await Promise.all([loadSales(), loadCatalog("")]);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu đơn vật lý"));
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!selectedSale) return toast.error("Vui lòng chọn một đơn để xóa");
    if (selectedSale.status !== "COMPLETED") return toast.error("Đơn này đã được hủy");
    const reason = window.prompt(`Lý do xóa đơn ${selectedSale.code}:`, "Xóa đơn vật lý")?.trim();
    if (!reason || !window.confirm("Đơn sẽ được hủy và hoàn lại tồn kho. Tiếp tục?")) return;
    try {
      await physicalSaleService.remove(selectedSale.id, reason);
      toast.success("Đã hủy đơn và hoàn lại tồn kho");
      setSelectedId(null);
      await Promise.all([loadSales(), loadCatalog("")]);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xóa đơn vật lý"));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Đơn hàng tại shop</h1>
            <p className="text-sm text-slate-500">Quản lý giao dịch và tồn kho tại cửa hàng vật lý.</p>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm mã đơn, khách hàng, số điện thoại, sản phẩm hoặc SKU"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 outline-none focus:border-blue-500"
                />
              </div>
              <button onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Thêm
              </button>
              <button onClick={() => void openEdit()} disabled={!selectedSale} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 disabled:opacity-40">
                <Pencil className="h-4 w-4" /> Sửa
              </button>
              <button onClick={() => void removeSelected()} disabled={!selectedSale} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 font-semibold text-red-600 disabled:opacity-40">
                <Trash2 className="h-4 w-4" /> Xóa
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-14 px-5 py-4">Chọn</th>
                    <th className="px-5 py-4">Sản phẩm</th>
                    <th className="px-5 py-4">Khách hàng</th>
                    <th className="px-5 py-4">Ngày mua</th>
                    <th className="px-5 py-4">Thanh toán</th>
                    <th className="px-5 py-4 text-right">Tổng tiền</th>
                    <th className="px-5 py-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => {
                    const representative = sale.items[0];
                    return (
                      <tr key={sale.id} onClick={() => setSelectedId(sale.id)} className={`cursor-pointer hover:bg-slate-50 ${selectedId === sale.id ? "bg-blue-50/70" : ""}`}>
                        <td className="px-5 py-4"><input type="radio" checked={selectedId === sale.id} onChange={() => setSelectedId(sale.id)} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                              {representative?.imageUrl ? <img src={representative.imageUrl} alt={representative.productName} className="h-full w-full object-cover" /> : null}
                            </div>
                            <div><p className="font-semibold text-slate-900">{representative?.productName ?? "Không có sản phẩm"}</p><p className="text-xs text-slate-500">{sale.code}{sale.items.length > 1 ? ` · +${sale.items.length - 1} sản phẩm` : ""}</p></div>
                          </div>
                        </td>
                        <td className="px-5 py-4"><p className="font-medium text-slate-800">{sale.customerName || "Khách lẻ"}</p><p className="text-xs text-slate-500">{sale.customerPhone || "—"}</p></td>
                        <td className="px-5 py-4 text-sm text-slate-600">{new Date(sale.createdAt).toLocaleString("vi-VN")}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}</td>
                        <td className="px-5 py-4 text-right font-semibold">{formatMoney(sale.totalAmount)}</td>
                        <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sale.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{sale.status === "COMPLETED" ? "Hoàn tất" : "Đã hủy"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {loading ? <p className="p-6 text-center text-sm text-slate-500">Đang tải...</p> : null}
            {!loading && sales.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Không có đơn vật lý phù hợp.</p> : null}
          </section>
        </div>
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center border-b px-6 py-4">
              <div className="flex-1"><h2 className="text-xl font-bold">{editingSale ? `Sửa đơn ${editingSale.code}` : "Thêm đơn vật lý"}</h2><p className="text-sm text-slate-500">Nhập khách hàng, sản phẩm và phương thức thanh toán.</p></div>
              <button onClick={closeModal} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid max-h-[calc(94vh-150px)] gap-6 overflow-y-auto p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Số điện thoại<input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3" placeholder="090..." /></label>
                  <label className="text-sm font-medium text-slate-700">Họ tên khách hàng<input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3" placeholder="Nguyễn Văn A" /></label>
                </div>
                <label className="block text-sm font-medium text-slate-700">Phương thức thanh toán<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3"><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option><option value="CARD">Thẻ</option></select></label>
                <div>
                  <label className="text-sm font-medium text-slate-700">Danh sách sản phẩm</label>
                  <div className="relative mt-2"><Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="h-11 w-full rounded-xl border pl-10 pr-3" placeholder="Tìm tên sản phẩm hoặc SKU" /></div>
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                    {catalog.map((item) => <button key={item.id} onClick={() => addProduct(item)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:border-blue-400"><div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100">{item.imageUrl ? <img src={item.imageUrl} alt={item.product.name} className="h-full w-full object-cover" /> : null}</div><span className="min-w-0 flex-1"><b className="block truncate">{item.product.name}</b><small className={item.inventoryConsistent ? "text-slate-500" : "text-red-600"}>{item.sku} · {variantLabel(item.attributes)} · Còn {item.sellableStock}{!item.inventoryConsistent ? " · Tồn kho lỗi" : ""}</small></span><span className="font-semibold">{formatMoney(item.price)}</span></button>)}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Sản phẩm trong đơn</h3>
                <div className="mt-3 space-y-3">
                  {cart.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><b className="block truncate">{item.product.name}</b><small className="text-slate-500">{item.sku} · {formatMoney(item.price)}</small></div><input type="number" min={1} value={item.quantity} onChange={(e) => setCart((rows) => rows.map((row) => row.id === item.id ? { ...row, quantity: Math.max(1, Number(e.target.value) || 1) } : row))} className="h-10 w-20 rounded-lg border px-2" /><button onClick={() => setCart((rows) => rows.filter((row) => row.id !== item.id))} className="text-red-600"><Trash2 className="h-4 w-4" /></button></div>)}
                  {!cart.length ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chưa có sản phẩm.</p> : null}
                </div>
                <div className="mt-5 flex justify-between border-t pt-4 text-lg font-bold"><span>Tổng tiền</span><span>{formatMoney(total)}</span></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4"><button onClick={closeModal} className="rounded-xl border px-4 py-2 font-medium">Hủy</button><button onClick={() => void save()} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Đang lưu..." : editingSale ? "Lưu thay đổi" : "Tạo đơn"}</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

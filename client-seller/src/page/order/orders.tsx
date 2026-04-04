import { Header, Sidebar } from "@/components/admin";
import { orderService } from "@/services/api";
import type {
  AdminOrderListItem,
  AdminOrderSort,
  AdminOrderTab,
} from "@/types/order";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
    case "PAID":
      return "bg-blue-100 text-blue-700";
    case "SHIPPED":
    case "DELIVERED":
      return "bg-purple-100 text-purple-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function primaryActionLabel(status: string) {
  if (status === "SHIPPED" || status === "DELIVERED") return "Invoice";
  return "Print Label";
}

export default function OrdersPage() {
  const [tab, setTab] = useState<AdminOrderTab>("all");
  const [sort, setSort] = useState<AdminOrderSort>("new");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    canceled: 0,
  });

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: "All", count: counts.all },
      { key: "pending" as const, label: "Pending", count: counts.pending },
      {
        key: "processing" as const,
        label: "Processing",
        count: counts.processing,
      },
      { key: "shipped" as const, label: "Shipped", count: counts.shipped },
      { key: "canceled" as const, label: "Canceled", count: counts.canceled },
    ],
    [counts],
  );

  const fetchCounts = async () => {
    try {
      const res = await orderService.getCounts();
      setCounts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({
        tab,
        sort,
        search,
        page: 1,
        limit: 20,
      });
      setOrders(res.data.items);
    } catch (e) {
      toast.error("Failed to load orders");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [tab, sort, search]);

  const handleApplySearch = () => {
    const s = searchInput.trim();
    setSearch(s ? s : undefined);
  };

  const handleCancel = async (orderId: string) => {
    try {
      await orderService.cancelOrder(orderId);
      toast.success("Order cancelled");
      fetchCounts();
      fetchOrders();
    } catch (e) {
      toast.error("Failed to cancel order");
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-9xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-600 mt-1">Track and manage orders</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplySearch();
                    }}
                    placeholder="Search orders (id, email, code)"
                    className="w-72 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as AdminOrderSort)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="new">New Order</option>
                  <option value="old">Oldest</option>
                </select>

                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Filter
                </button>

                <button
                  onClick={handleApplySearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    tab === t.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Payment</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {loading ? (
                <div className="p-8 text-sm text-gray-600">Loading…</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-sm text-gray-600">
                  No orders found.
                </div>
              ) : (
                <div>
                  {orders.map((order) => {
                    const first = order.items[0];
                    const extraCount = Math.max(order.items.length - 1, 0);
                    const canCancel = order.status === "PENDING";

                    return (
                      <div
                        key={order.id}
                        className="grid grid-cols-12 px-6 py-5 border-b border-gray-100"
                      >
                        <div className="col-span-5">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                              {first?.imageUrl ? (
                                <img
                                  src={first.imageUrl}
                                  alt={first.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="text-xs text-gray-500">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {first?.name ?? "(No items)"}
                                  </p>
                                  {first?.attributesText ? (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {first.attributesText}
                                    </p>
                                  ) : null}
                                  {first ? (
                                    <p className="text-xs text-gray-600 mt-1">
                                      Qty: {first.quantity}
                                      {extraCount > 0
                                        ? ` • +${extraCount} more item(s)`
                                        : ""}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="mt-3 text-xs text-gray-600">
                                <span className="font-medium text-gray-900">
                                  {order.user.label}
                                </span>
                                <span className="mx-2">•</span>
                                <span>{formatDate(order.createdAt)}</span>
                                <span className="mx-2">•</span>
                                <span className="font-mono">{order.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatMoney(order.totalPrice)}
                            </p>
                            {order.items.length > 0 ? (
                              <p className="text-xs text-gray-600 mt-1">
                                {order.items.length} item(s)
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {order.payment.method ?? "—"}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {order.payment.status ??
                                order.payment.transactionStatus ??
                                "—"}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-1 flex items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {}}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                          >
                            {primaryActionLabel(order.status)}
                          </button>
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={!canCancel}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              canCancel
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Filters() {
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [priceRange, setPriceRange] = useState("");

  return (
    <div className="flex gap-4 mb-6">
      {/* Bộ lọc danh mục */}
      <div className="relative min-w-64">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Danh mục: Tất cả danh mục</option>
          <option value="electronics">Điện tử</option>
          <option value="furniture">Nội thất</option>
          <option value="accessories">Phụ kiện</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="relative min-w-40">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Trạng thái: Tất cả trạng thái</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
          <option value="archived">Đã lưu trữ</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Bộ lọc khoảng giá */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Khoảng giá: Tối thiểu - tối đa VND"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

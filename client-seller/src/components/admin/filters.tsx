import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Filters() {
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [priceRange, setPriceRange] = useState("");

  return (
    <div className="flex gap-4 mb-6">
      {/* Category Filter */}
      <div className="relative min-w-64">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Category: All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="furniture">Furniture</option>
          <option value="accessories">Accessories</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Status Filter */}
      <div className="relative min-w-40">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Status: All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Price Range Filter */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Price Range: Min - Max VND"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

/** Query lấy danh sách sản phẩm với filter và phân trang */
export interface GetProductsQuery {
  /** Trang hiện tại (bắt đầu từ 1) */
  page?: number;
  /** Số sản phẩm mỗi trang (mặc định: 10) */
  limit?: number;
  /** Filter theo category slug hoặc ID */
  category?: string;
  /** Filter theo size (từ variant attributes) */
  size?: string;
  /** Filter theo color (từ variant attributes) */
  color?: string;
  /** Filter theo khoảng giá (format: "min-max" hoặc "min-" hoặc "-max") */
  priceRange?: string;
  /** Từ khóa tìm kiếm theo tên/slug sản phẩm */
  search?: string;
  /** Sort theo format "field:order", ví dụ: "createdAt:desc" */
  sort?: string;
}

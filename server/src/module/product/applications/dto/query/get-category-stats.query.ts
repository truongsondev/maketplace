/** Query lấy thống kê sản phẩm theo category */
export interface GetCategoryStatsQuery {
  /** Chỉ lấy category có ít nhất 1 sản phẩm (mặc định: false) */
  nonEmptyOnly?: boolean;
}

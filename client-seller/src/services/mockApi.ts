// Mock API Service
export const mockApiService = {
  // Get categories
  async getCategories() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        categories: [
          {
            id: "0f8c0ae5-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Áo",
            slug: "ao",
            description: "Danh mục sản phẩm Áo",
            imageUrl: null,
            parentId: null,
            sortOrder: 1,
            createdAt: "2026-03-08T07:40:21.000Z",
            updatedAt: "2026-03-08T07:40:21.000Z",
          },
          {
            id: "0f8d98b8-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Quần",
            slug: "quan",
            description: "Danh mục sản phẩm Quần",
            imageUrl: null,
            parentId: null,
            sortOrder: 2,
            createdAt: "2026-03-08T07:40:21.000Z",
            updatedAt: "2026-03-08T07:40:21.000Z",
          },
          {
            id: "0f8d9e91-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Giày",
            slug: "giay",
            description: "Danh mục sản phẩm Giày",
            imageUrl: null,
            parentId: null,
            sortOrder: 3,
            createdAt: "2026-03-08T07:40:21.000Z",
            updatedAt: "2026-03-08T07:40:21.000Z",
          },
          {
            id: "0f8da9af-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Phụ kiện",
            slug: "phu-kien",
            description: "Danh mục sản phẩm Phụ kiện",
            imageUrl: null,
            parentId: null,
            sortOrder: 4,
            createdAt: "2026-03-08T07:40:21.000Z",
            updatedAt: "2026-03-08T07:40:21.000Z",
          },
        ],
        total: 4,
      },
      message: "Categories retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  },

  // Get tags
  async getTags() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      success: true,
      data: {
        tags: [
          {
            id: "18710583-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Best Seller",
          },
          {
            id: "18710d76-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Clearance",
          },
          {
            id: "18710af8-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Eco-Friendly",
          },
          {
            id: "18710a8a-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Featured",
          },
          {
            id: "187107ae-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Hot Deal",
          },
          {
            id: "18710813-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Limited Edition",
          },
          {
            id: "1870b156-1ac2-11f1-8d94-c6ef452c3f37",
            name: "New Arrival",
          },
          {
            id: "18710cfb-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Premium",
          },
          {
            id: "18710736-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Sale",
          },
          {
            id: "18710976-1ac2-11f1-8d94-c6ef452c3f37",
            name: "Trending",
          },
        ],
        total: 10,
      },
      message: "Tags retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  },
};

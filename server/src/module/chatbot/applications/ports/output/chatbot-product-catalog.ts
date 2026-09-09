export interface ChatbotCatalogSearchInput {
  search?: string;
  category?: string;
  color?: string;
  size?: string;
  usageOccasion?: string;
  minPrice?: number;
  maxPrice?: number;
  limit: number;
}

export interface ChatbotCatalogProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  href: string;
  categorySlugs?: string[];
  usageOccasions?: string[];
}

export interface IChatbotProductCatalog {
  searchProducts(input: ChatbotCatalogSearchInput): Promise<ChatbotCatalogProduct[]>;
}

export interface CartDetailResult {
  cartId: string;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  items: CartItemDetail[];
}

export interface CartItemDetail {
  itemId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  variantAttributes: Record<string, any>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: {
    url: string;
    altText: string;
  };
}

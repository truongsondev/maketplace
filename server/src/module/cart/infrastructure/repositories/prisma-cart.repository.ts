import { PrismaClient } from '@/generated/prisma/client';
import {
  ICartRepository,
  CartItemData,
  AddCartItemData,
  CartItemByUserData,
} from '../../applications/ports/output/cart.repository';
import { Cart, CartItem } from '../../entities/cart.entity';

export class PrismaCartRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                attributes: true,
                price: true,
                stockAvailable: true,
              },
            },
          },
        },
      },
    });

    if (!cart) return null;

    return new Cart(
      cart.id,
      cart.userId,
      cart.createdAt,
      cart.items.map((item) => {
        if (!item.variantId || !item.variant) {
          throw new Error(`Cart item ${item.id} missing required variant`);
        }

        return new CartItem(
          item.id,
          item.cartId,
          item.productId,
          item.product.name,
          item.variantId,
          {
            productName: item.product.name,
            sku: item.variant.sku,
            attributes: item.variant.attributes as Record<string, any>,
            price: Number(item.variant.price),
            stockAvailable: item.variant.stockAvailable,
          },
          null, // Image will be loaded separately
          item.quantity,
        );
      }),
    );
  }

  async create(userId: string): Promise<Cart> {
    const cart = await this.prisma.cart.create({
      data: { userId },
    });

    return new Cart(cart.id, cart.userId, cart.createdAt, []);
  }

  async findItem(
    cartId: string,
    productId: string,
    variantId: string,
  ): Promise<CartItemData | null> {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId,
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    return item;
  }

  async findItemByIdForUser(itemId: string, userId: string): Promise<CartItemByUserData | null> {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
      select: {
        id: true,
        cartId: true,
        productId: true,
        variantId: true,
        quantity: true,
      },
    });

    if (!item || !item.variantId) {
      return null;
    }

    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    };
  }

  async addItem(data: AddCartItemData): Promise<void> {
    await this.prisma.cartItem.create({
      data: {
        cartId: data.cartId,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
      },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: string): Promise<void> {
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async getCartDetail(userId: string): Promise<Cart | null> {
    return this.findByUserId(userId);
  }

  async getCartSummary(userId: string): Promise<{ totalItems: number; totalPrice: number }> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return {
        totalItems: 0,
        totalPrice: 0,
      };
    }

    const items = await this.prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
      },
      select: {
        quantity: true,
        variant: {
          select: {
            price: true,
          },
        },
      },
    });

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = items.reduce(
      (acc, item) => acc + item.quantity * Number(item.variant?.price ?? 0),
      0,
    );

    return {
      totalItems,
      totalPrice,
    };
  }
}

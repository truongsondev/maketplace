import { CartDetailResult, UpdateCartItemCommand } from '../dto';
import {
  CartItemNotFoundError,
  ExceedsMaxQuantityError,
  InsufficientStockError,
  InvalidQuantityError,
} from '../errors';
import { IUpdateCartItemUseCase } from '../ports/input';
import { ICartRepository, IProductImageRepository, IVariantRepository } from '../ports/output';

const MAX_QUANTITY_PER_VARIANT = 10;

export class UpdateCartItemUseCase implements IUpdateCartItemUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly variantRepository: IVariantRepository,
    private readonly productImageRepository: IProductImageRepository,
  ) {}

  async execute(userId: string, command: UpdateCartItemCommand): Promise<CartDetailResult> {
    if (!command.itemId || command.itemId.trim() === '') {
      throw new CartItemNotFoundError();
    }

    if (!Number.isInteger(command.quantity) || command.quantity <= 0) {
      throw new InvalidQuantityError(command.quantity);
    }

    const item = await this.cartRepository.findItemByIdForUser(command.itemId, userId);
    if (!item) {
      throw new CartItemNotFoundError(command.itemId);
    }

    if (command.quantity > MAX_QUANTITY_PER_VARIANT) {
      throw new ExceedsMaxQuantityError({
        maxQuantity: MAX_QUANTITY_PER_VARIANT,
        currentInCart: item.quantity,
        requested: command.quantity,
      });
    }

    const delta = command.quantity - item.quantity;

    if (delta > 0) {
      const variant = await this.variantRepository.findByIdWithProduct(item.variantId);
      if (!variant || variant.isDeleted || variant.product.isDeleted) {
        throw new CartItemNotFoundError(command.itemId);
      }

      const availableStock = variant.stockOnHand - variant.stockReserved;
      if (availableStock < delta) {
        throw new InsufficientStockError({
          variantId: variant.id,
          sku: variant.sku,
          requested: delta,
          available: availableStock,
        });
      }

      await this.variantRepository.reserveStock(item.variantId, delta);
    } else if (delta < 0) {
      await this.variantRepository.releaseStock(item.variantId, Math.abs(delta));
    }

    await this.cartRepository.updateItemQuantity(item.id, command.quantity);

    const updatedCart = await this.cartRepository.getCartDetail(userId);
    if (!updatedCart) {
      throw new Error('Cart not found after update');
    }

    return {
      cartId: updatedCart.id,
      totalItems: updatedCart.totalItems,
      totalQuantity: updatedCart.totalQuantity,
      totalAmount: updatedCart.totalAmount,
      items: await Promise.all(
        updatedCart.items.map(async (cartItem) => {
          const image = await this.productImageRepository.findImageForVariant(
            cartItem.variantId,
            cartItem.productId,
          );

          return {
            itemId: cartItem.id,
            productId: cartItem.productId,
            productName: cartItem.variantInfo.productName,
            variantId: cartItem.variantId,
            variantSku: cartItem.variantInfo.sku,
            variantAttributes: cartItem.variantInfo.attributes,
            quantity: cartItem.quantity,
            unitPrice: cartItem.unitPrice,
            subtotal: cartItem.subtotal,
            image: image
              ? {
                  url: image.url,
                  altText: image.altText || cartItem.variantInfo.productName,
                }
              : undefined,
          };
        }),
      ),
    };
  }
}

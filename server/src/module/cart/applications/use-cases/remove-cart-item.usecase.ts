import { CartDetailResult } from '../dto';
import { CartItemNotFoundError } from '../errors';
import { IRemoveCartItemUseCase } from '../ports/input';
import { ICartRepository, IProductImageRepository, IVariantRepository } from '../ports/output';

export class RemoveCartItemUseCase implements IRemoveCartItemUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly variantRepository: IVariantRepository,
    private readonly productImageRepository: IProductImageRepository,
  ) {}

  async execute(userId: string, itemId: string): Promise<CartDetailResult> {
    if (!itemId || itemId.trim() === '') {
      throw new CartItemNotFoundError();
    }

    const item = await this.cartRepository.findItemByIdForUser(itemId, userId);
    if (!item) {
      throw new CartItemNotFoundError(itemId);
    }

    await this.cartRepository.removeItem(item.id);
    await this.variantRepository.releaseStock(item.variantId, item.quantity);

    let updatedCart = await this.cartRepository.getCartDetail(userId);
    if (!updatedCart) {
      updatedCart = await this.cartRepository.create(userId);
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

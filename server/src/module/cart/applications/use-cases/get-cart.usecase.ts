import { CartDetailResult } from '../dto';
import { IGetCartUseCase } from '../ports/input';
import { ICartRepository, IProductImageRepository } from '../ports/output';

export class GetCartUseCase implements IGetCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productImageRepository: IProductImageRepository,
  ) {}

  async execute(userId: string): Promise<CartDetailResult> {
    let cart = await this.cartRepository.getCartDetail(userId);

    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    return {
      cartId: cart.id,
      totalItems: cart.totalItems,
      totalQuantity: cart.totalQuantity,
      totalAmount: cart.totalAmount,
      items: await Promise.all(
        cart.items.map(async (item) => {
          const image = await this.productImageRepository.findImageForVariant(
            item.variantId,
            item.productId,
          );

          return {
            itemId: item.id,
            productId: item.productId,
            productName: item.variantInfo.productName,
            variantId: item.variantId,
            variantSku: item.variantInfo.sku,
            variantAttributes: item.variantInfo.attributes,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            image: image
              ? {
                  url: image.url,
                  altText: image.altText || item.variantInfo.productName,
                }
              : undefined,
          };
        }),
      ),
    };
  }
}

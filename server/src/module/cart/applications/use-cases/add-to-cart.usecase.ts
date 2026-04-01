import { IAddToCartUseCase } from '../ports/input';
import { ICartRepository, IVariantRepository, IProductImageRepository } from '../ports/output';
import { AddToCartCommand, CartDetailResult } from '../dto';
import {
  VariantRequiredError,
  VariantNotFoundError,
  ProductNotFoundError,
  InsufficientStockError,
  ExceedsMaxQuantityError,
  InvalidQuantityError,
} from '../errors';

const MAX_QUANTITY_PER_VARIANT = 10;

export class AddToCartUseCase implements IAddToCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly variantRepository: IVariantRepository,
    private readonly productImageRepository: IProductImageRepository,
  ) {}

  async execute(userId: string, command: AddToCartCommand): Promise<CartDetailResult> {
    // 1. Validate command
    this.validateCommand(command);

    // 2. Validate variant and get product info
    const variantWithProduct = await this.variantRepository.findByIdWithProduct(command.variantId);
    if (!variantWithProduct) {
      throw new VariantNotFoundError();
    }

    if (variantWithProduct.isDeleted) {
      throw new VariantNotFoundError();
    }

    if (variantWithProduct.product.isDeleted) {
      throw new ProductNotFoundError();
    }

    // 3. Get or create cart
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    // 4. Check existing cart item
    const existingItem = await this.cartRepository.findItem(
      cart.id,
      variantWithProduct.product.id,
      command.variantId,
    );

    const currentQuantity = existingItem?.quantity || 0;
    const newQuantity = currentQuantity + command.quantity;

    // 5. Validate stock and max quantity
    const availableStock = variantWithProduct.stockAvailable - variantWithProduct.stockReserved;

    if (availableStock < command.quantity) {
      throw new InsufficientStockError({
        variantId: command.variantId,
        sku: variantWithProduct.sku,
        requested: command.quantity,
        available: availableStock,
      });
    }

    if (newQuantity > MAX_QUANTITY_PER_VARIANT) {
      throw new ExceedsMaxQuantityError({
        maxQuantity: MAX_QUANTITY_PER_VARIANT,
        currentInCart: currentQuantity,
        requested: newQuantity,
      });
    }

    // 6. Add or update cart item
    if (existingItem) {
      await this.cartRepository.updateItemQuantity(existingItem.id, newQuantity);
    } else {
      await this.cartRepository.addItem({
        cartId: cart.id,
        productId: variantWithProduct.product.id,
        variantId: command.variantId,
        quantity: command.quantity,
      });
    }

    // 7. Reserve stock
    await this.variantRepository.reserveStock(command.variantId, command.quantity);

    // 8. Get updated cart detail
    const updatedCart = await this.cartRepository.getCartDetail(userId);
    if (!updatedCart) {
      throw new Error('Cart not found after update');
    }

    // 9. Load images for all cart items
    const cartDetailResult: CartDetailResult = {
      cartId: updatedCart.id,
      totalItems: updatedCart.totalItems,
      totalQuantity: updatedCart.totalQuantity,
      totalAmount: updatedCart.totalAmount,
      items: await Promise.all(
        updatedCart.items.map(async (item) => {
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

    return cartDetailResult;
  }

  private validateCommand(command: AddToCartCommand): void {
    if (!command.variantId || command.variantId.trim() === '') {
      throw new VariantRequiredError();
    }

    if (!Number.isInteger(command.quantity) || command.quantity <= 0) {
      throw new InvalidQuantityError(command.quantity);
    }
  }
}

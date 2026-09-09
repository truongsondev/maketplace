import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import type { ProductDetail, ProductImage, ProductVariant } from "@/types/api";
import type { UpdateProductVariantDto } from "@/types/api";
import { cloudinaryService, productService } from "@/services/api";
import { toast } from "sonner";

interface VariantsTabProps {
  product: ProductDetail;
  onUpdate: () => void;
}

export function VariantsTab({ product, onUpdate }: VariantsTabProps) {
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const [formSku, setFormSku] = useState("");
  const [formPrice, setFormPrice] = useState<number>(product.basePrice ?? 0);
  const [formStockAvailable, setFormStockAvailable] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [formAttributes, setFormAttributes] = useState<
    Array<{ key: string; value: string }>
  >([{ key: "", value: "" }]);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreviewUrl, setFormImagePreviewUrl] = useState<string | null>(
    null,
  );
  const [editingVariantImage, setEditingVariantImage] =
    useState<ProductImage | null>(null);

  const isInternalDefaultVariant = (variant: ProductVariant) => {
    const nonEmptyAttributes = Object.entries(variant.attributes ?? {}).filter(
      ([key, value]) => {
        if (!key || key.trim() === "") return false;
        if (value === null || value === undefined) return false;
        return String(value).trim().length > 0;
      },
    ).length;

    return (
      nonEmptyAttributes === 0 &&
      variant.sku.trim().toUpperCase().endsWith("-DEFAULT")
    );
  };

  const isSimpleModeProduct =
    product.variants.length === 1 &&
    isInternalDefaultVariant(product.variants[0]);

  const visibleVariants = isSimpleModeProduct ? [] : product.variants;
  const internalSimpleVariant = isSimpleModeProduct
    ? product.variants[0]
    : null;
  const [simpleStockAvailable, setSimpleStockAvailable] = useState<number>(
    internalSimpleVariant?.stockAvailable ?? 0,
  );
  const [simpleMinStock, setSimpleMinStock] = useState<number>(
    internalSimpleVariant?.minStock ?? 0,
  );

  useEffect(() => {
    setSimpleStockAvailable(internalSimpleVariant?.stockAvailable ?? 0);
    setSimpleMinStock(internalSimpleVariant?.minStock ?? 0);
  }, [
    internalSimpleVariant?.id,
    internalSimpleVariant?.stockAvailable,
    internalSimpleVariant?.minStock,
  ]);

  const currentVariants: UpdateProductVariantDto[] = useMemo(
    () =>
      visibleVariants.map((v) => ({
        id: v.id,
        sku: v.sku,
        attributes: v.attributes,
        price: v.price,
        stockAvailable: v.stockAvailable,
        minStock: v.minStock,
      })),
    [visibleVariants],
  );

  const resetModalState = () => {
    if (formImagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(formImagePreviewUrl);
    }
    setEditingVariantId(null);
    setFormSku("");
    setFormPrice(product.basePrice ?? 0);
    setFormStockAvailable(0);
    setFormMinStock(5);
    setFormAttributes([{ key: "", value: "" }]);
    setFormImageFile(null);
    setFormImagePreviewUrl(null);
    setEditingVariantImage(null);
  };

  const openAddModal = () => {
    resetModalState();
    setIsModalOpen(true);
  };

  const openEditModal = (variant: ProductVariant) => {
    setEditingVariantId(variant.id);
    setFormSku(variant.sku);
    setFormPrice(variant.price);
    setFormStockAvailable(variant.stockAvailable);
    setFormMinStock(variant.minStock);
    setFormImageFile(null);
    setFormImagePreviewUrl(null);
    setEditingVariantImage(variant.images[0] ?? null);

    const attrs = Object.entries(variant.attributes ?? {})
      .map(([key, value]) => ({
        key: String(key),
        value: value === null || value === undefined ? "" : String(value ?? ""),
      }))
      .filter((row) => row.key.trim().length > 0);

    setFormAttributes(attrs.length > 0 ? attrs : [{ key: "", value: "" }]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModalState();
  };

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.stockAvailable === 0) {
      return { label: "Hết hàng", color: "bg-red-100 text-red-700" };
    }
    if (variant.stockAvailable < variant.minStock) {
      return { label: "Sắp hết", color: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "Còn hàng", color: "bg-green-100 text-green-700" };
  };

  const extractCloudinaryPublicId = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      const uploadMarker = "/upload/";
      const uploadIndex = parsedUrl.pathname.indexOf(uploadMarker);
      if (uploadIndex === -1) return null;

      const afterUpload = parsedUrl.pathname.slice(
        uploadIndex + uploadMarker.length,
      );
      const parts = afterUpload.split("/").filter(Boolean);
      const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));
      const publicIdParts =
        versionIndex >= 0 ? parts.slice(versionIndex + 1) : parts;
      if (publicIdParts.length === 0) return null;

      return publicIdParts
        .join("/")
        .replace(/\.[^/.]+$/, "")
        .trim();
    } catch {
      return null;
    }
  };

  const handleVariantImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    if (formImagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(formImagePreviewUrl);
    }

    setFormImageFile(file);
    setFormImagePreviewUrl(URL.createObjectURL(file));
  };

  const clearVariantImageSelection = () => {
    if (formImagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(formImagePreviewUrl);
    }
    setFormImageFile(null);
    setFormImagePreviewUrl(null);
  };

  const saveVariantImageReplacement = async (
    variantId: string,
    sku: string,
    oldImage: ProductImage | null,
  ) => {
    if (!formImageFile) return;

    const signatureResponse = await cloudinaryService.getSignature(product.id);
    const uploaded = await cloudinaryService.uploadImageWithPublicId(
      formImageFile,
      signatureResponse.data,
    );

    await productService.saveProductImage(product.id, {
      url: uploaded.url,
      publicId: uploaded.publicId,
      variantId,
      altText: `Ảnh biến thể ${sku}`,
      isPrimary: false,
      sortOrder: 0,
    });

    if (!oldImage) return;

    const oldPublicId = extractCloudinaryPublicId(oldImage.url);
    if (!oldPublicId) {
      console.warn("Không xác định được publicId ảnh cũ", oldImage.url);
      return;
    }

    await productService.deleteProductImage(product.id, oldImage.id, oldPublicId);
  };

  const handleRemoveAllVariants = async () => {
    if (saving) return;
    if (visibleVariants.length === 0) return;

    if (!confirm("Bạn có chắc muốn xoá tất cả biến thể?")) return;

    try {
      setSaving(true);
      await productService.updateProduct(product.id, { variants: [] });
      toast.success("Đã xoá tất cả biến thể");
      onUpdate();
    } catch (error) {
      toast.error("Xoá biến thể thất bại");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (saving) return;

    if (!confirm("Bạn có chắc muốn xoá biến thể này?")) return;

    try {
      setSaving(true);
      const nextVariants = currentVariants.filter((v) => v.id !== variantId);
      await productService.updateProduct(product.id, {
        variants: nextVariants,
      });
      toast.success("Đã xoá biến thể");
      onUpdate();
    } catch (error) {
      toast.error("Xoá biến thể thất bại");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVariant = async () => {
    if (saving) return;

    const sku = formSku.trim();
    if (!sku) {
      toast.error("SKU là bắt buộc");
      return;
    }

    if (Number.isNaN(formPrice) || formPrice < 0) {
      toast.error("Giá phải là số không âm");
      return;
    }

    if (Number.isNaN(formStockAvailable) || formStockAvailable < 0) {
      toast.error("Tồn kho sẵn có phải là số không âm");
      return;
    }

    if (Number.isNaN(formMinStock) || formMinStock < 0) {
      toast.error("Tồn kho tối thiểu phải là số không âm");
      return;
    }

    const attributes: Record<string, string> = {};
    for (const row of formAttributes) {
      const key = row.key.trim();
      const value = row.value.trim();
      if (!key) continue;
      if (!value) continue;
      attributes[key] = value;
    }

    const skuExistsInProduct = currentVariants.some(
      (v) => v.sku === sku && v.id !== editingVariantId,
    );
    if (skuExistsInProduct) {
      toast.error("SKU đã tồn tại trong sản phẩm này");
      return;
    }

    const nextVariant: UpdateProductVariantDto = {
      ...(editingVariantId ? { id: editingVariantId } : {}),
      sku,
      attributes,
      price: formPrice,
      stockAvailable: formStockAvailable,
      minStock: formMinStock,
    };

    const nextVariants = editingVariantId
      ? currentVariants.map((v) =>
          v.id === editingVariantId ? nextVariant : v,
        )
      : [...currentVariants, nextVariant];

    let variantSaved = false;

    try {
      setSaving(true);
      await productService.updateProduct(product.id, {
        variants: nextVariants,
      });
      variantSaved = true;

      if (formImageFile) {
        let targetVariantId = editingVariantId;
        let oldImage = editingVariantImage;

        if (!targetVariantId) {
          const refreshedProduct = await productService.getProduct(product.id);
          const createdVariant = refreshedProduct.data.variants.find(
            (variant) => variant.sku === sku,
          );
          targetVariantId = createdVariant?.id ?? null;
          oldImage = createdVariant?.images[0] ?? null;
        }

        if (!targetVariantId) {
          throw new Error("Không tìm thấy biến thể vừa lưu để gắn ảnh");
        }

        await saveVariantImageReplacement(targetVariantId, sku, oldImage);
      }

      toast.success(
        editingVariantId ? "Đã cập nhật biến thể" : "Đã thêm biến thể",
      );
      closeModal();
      onUpdate();
    } catch (error) {
      toast.error(
        variantSaved
          ? "Đã lưu biến thể nhưng cập nhật ảnh thất bại"
          : "Lưu biến thể thất bại",
      );
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSimpleInventory = async () => {
    if (saving || !internalSimpleVariant) return;

    if (Number.isNaN(simpleStockAvailable) || simpleStockAvailable < 0) {
      toast.error("Tồn kho sẵn có phải là số không âm");
      return;
    }

    if (Number.isNaN(simpleMinStock) || simpleMinStock < 0) {
      toast.error("Tồn kho tối thiểu phải là số không âm");
      return;
    }

    try {
      setSaving(true);
      await productService.updateProduct(product.id, {
        variants: [
          {
            id: internalSimpleVariant.id,
            sku: internalSimpleVariant.sku,
            attributes: internalSimpleVariant.attributes,
            price: internalSimpleVariant.price,
            stockAvailable: simpleStockAvailable,
            minStock: simpleMinStock,
          },
        ],
      });
      toast.success("Đã cập nhật tồn kho sản phẩm không biến thể");
      onUpdate();
    } catch (error) {
      toast.error("Cập nhật tồn kho thất bại");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Biến thể sản phẩm ({visibleVariants.length})
        </h3>
        <div className="flex items-center gap-2">
          {visibleVariants.length > 0 && (
            <button
              onClick={handleRemoveAllVariants}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Xoá tất cả
            </button>
          )}
          <button
            onClick={openAddModal}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm biến thể
          </button>
        </div>
      </div>

      {isSimpleModeProduct ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-6">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sản phẩm đang ở chế độ không biến thể
            </h3>
            <p className="text-gray-600">
              Hệ thống đang dùng 1 phiên bản mặc định nội bộ để tương thích giỏ
              hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg border border-gray-200 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tồn kho sẵn có
              </label>
              <input
                type="number"
                min={0}
                value={simpleStockAvailable}
                onChange={(e) =>
                  setSimpleStockAvailable(Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tồn kho tối thiểu
              </label>
              <input
                type="number"
                min={0}
                value={simpleMinStock}
                onChange={(e) => setSimpleMinStock(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSaveSimpleInventory}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Lưu tồn kho
            </button>
            <button
              onClick={openAddModal}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-5 h-5" />
              Chuyển sang có biến thể
            </button>
          </div>
        </div>
      ) : visibleVariants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có biến thể
          </h3>
          <p className="text-gray-600 mb-4">
            Thêm biến thể đầu tiên để bắt đầu quản lý tồn kho
          </p>
          <button
            onClick={() => {
              openAddModal();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm biến thể
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Thuộc tính
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">
                  Ảnh
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleVariants.map((variant) => {
                const stockStatus = getStockStatus(variant);
                return (
                  <tr
                    key={variant.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {variant.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(variant.attributes).map(
                          ([key, value]) => (
                            <span
                              key={key}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {key}: {String(value)}
                            </span>
                          ),
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {variant.price.toLocaleString()} đ
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Có sẵn: {variant.stockAvailable}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Đã giữ: {variant.stockReserved}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Tối thiểu: {variant.minStock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {variant.images.length > 0 ? (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={variant.images[0].url}
                            alt={variant.sku}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          Chưa có ảnh
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            openEditModal(variant);
                          }}
                          disabled={saving}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Bạn có chắc muốn xoá biến thể này?")) {
                              handleDeleteVariant(variant.id);
                            }
                          }}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">
                {editingVariantId ? "Sửa biến thể" : "Thêm biến thể"}
              </h4>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-900"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tồn kho sẵn có <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formStockAvailable}
                    onChange={(e) =>
                      setFormStockAvailable(Number(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tồn kho tối thiểu
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Thuộc tính
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormAttributes((prev) => [
                        ...prev,
                        { key: "", value: "" },
                      ])
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Thêm thuộc tính
                  </button>
                </div>

                <div className="space-y-2">
                  {formAttributes.map((row, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input
                        value={row.key}
                        onChange={(e) => {
                          const next = formAttributes.slice();
                          next[index] = { ...row, key: e.target.value };
                          setFormAttributes(next);
                        }}
                        className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="khóa (vd: màu)"
                      />
                      <input
                        value={row.value}
                        onChange={(e) => {
                          const next = formAttributes.slice();
                          next[index] = { ...row, value: e.target.value };
                          setFormAttributes(next);
                        }}
                        className="col-span-6 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="giá trị (vd: đỏ)"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormAttributes((prev) =>
                            prev.length <= 1
                              ? [{ key: "", value: "" }]
                              : prev.filter((_, i) => i !== index),
                          )
                        }
                        className="col-span-1 px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Xoá"
                        title="Xoá"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Các khóa/giá trị trống sẽ bị bỏ qua.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ảnh biến thể
                </label>
                <div className="flex flex-wrap items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="h-28 w-28 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {formImagePreviewUrl || editingVariantImage?.url ? (
                      <img
                        src={formImagePreviewUrl ?? editingVariantImage?.url}
                        alt="Ảnh biến thể"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                        <Upload className="h-4 w-4" />
                        Chọn ảnh
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleVariantImageChange}
                        />
                      </label>
                      {formImageFile ? (
                        <button
                          type="button"
                          onClick={clearVariantImageSelection}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-white"
                        >
                          Bỏ chọn
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500">
                      Nếu chọn ảnh mới, ảnh cũ của biến thể sẽ được thay thế sau
                      khi lưu.
                    </p>
                    {formImageFile ? (
                      <p className="truncate text-xs font-medium text-gray-700">
                        Ảnh mới: {formImageFile.name}
                      </p>
                    ) : editingVariantImage ? (
                      <p className="text-xs text-gray-500">
                        Đang dùng ảnh hiện tại của biến thể.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Huỷ
              </button>
              <button
                onClick={handleSaveVariant}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

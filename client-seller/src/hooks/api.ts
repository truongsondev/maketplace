import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  categoryService,
  tagService,
  productService,
  cloudinaryService,
  productTypeSchemaService,
} from "@/services/api";
import type {
  CreateProductCommand,
  CloudinarySignature,
  ProductTypeSchemaResponse,
} from "@/types/api";
import { toast } from "sonner";

// Categories hook
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Tags hook
export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: tagService.getTags,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useProductTypeSchema = (categoryId: string) => {
  return useQuery<ProductTypeSchemaResponse>({
    queryKey: ["productTypeSchema", categoryId],
    queryFn: () => productTypeSchemaService.getSchema(categoryId),
    enabled: Boolean(categoryId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

// Cloudinary signature hook
export const useCloudinarySignature = () => {
  return useMutation({
    mutationFn: cloudinaryService.getSignature,
    onError: () => {
      toast.error("Lỗi khi lấy chữ ký upload");
    },
  });
};

// Image upload hook
export const useImageUpload = () => {
  return useMutation({
    mutationFn: async ({
      file,
      signature,
    }: {
      file: File;
      signature: CloudinarySignature;
    }) => {
      return cloudinaryService.uploadImage(file, signature);
    },
    onError: () => {
      toast.error("Lỗi khi tải ảnh lên");
    },
  });
};

// Create product hook
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductCommand) =>
      productService.createProduct(data),
    onSuccess: () => {
      toast.success("Tạo sản phẩm thành công!");
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } },
    ) => {
      console.error("Error creating product:", error);
      const errorMessage =
        error?.response?.data?.message || "Lỗi khi tạo sản phẩm";
      toast.error(errorMessage);
    },
  });
};

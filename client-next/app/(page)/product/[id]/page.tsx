"use client";

import { useRouter, useParams } from "next/navigation";
import { useProductDetail } from "@/hooks/use-product-detail";
import {
  Loading,
  NotFound,
  ProductDetailContent,
} from "@/components/page/product";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params?.id;
  const productId = Array.isArray(id) ? id[0] : (id as string);

  const { data: product, isLoading, error } = useProductDetail(productId);

  if (isLoading) return <Loading />;
  if (error || !product) return <NotFound onBack={() => router.push("/")} />;

  return <ProductDetailContent product={product} />;
}

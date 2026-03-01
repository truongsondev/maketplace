"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
} & ExternalToast;

function toast({ title, description, variant, ...props }: ToastProps) {
  switch (variant) {
    case "destructive":
      return sonnerToast.error(title, { description, ...props });
    case "success":
      return sonnerToast.success(title, { description, ...props });
    case "warning":
      return sonnerToast.warning(title, { description, ...props });
    case "info":
      return sonnerToast.info(title, { description, ...props });
    default:
      return sonnerToast(title, { description, ...props });
  }
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
export type { ToastProps };

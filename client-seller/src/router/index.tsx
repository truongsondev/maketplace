import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import ProductsPage from "../page/product/products";
import ProductDetailPage from "../page/product/product-detail";
import AddProductPage from "../page/product/create-product";
import LoginPage from "../page/auth/login";
import Dashboard from "../page/dashboard";
import NotFound from "../page/not-found";
import OrdersPage from "../page/order/orders";
import VouchersPage from "../page/voucher/vouchers";
import BannersPage from "../page/banner/banners";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/create"
        element={
          <ProtectedRoute>
            <AddProductPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/voucher"
        element={
          <ProtectedRoute>
            <VouchersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/banner"
        element={
          <ProtectedRoute>
            <BannersPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

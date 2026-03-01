import { Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "../page/home";
import AddProductPage from "../page/product/create-product";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/products" element={<AdminPanel />} />
      <Route path="/products/add" element={<AddProductPage />} />
      <Route path="/products/create" element={<AddProductPage />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}

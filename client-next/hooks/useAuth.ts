import { useState } from "react";
import { loginApi } from "@/services/auth.service";

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = async (payload: { password: string }) => {
    try {
      setLoading(true);
      const res = await loginApi(payload);
      localStorage.setItem("accessToken", res.accessToken);
      console.log("LOGIN OK", res);
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}

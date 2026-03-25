"use client";

import { useRouter } from "next/navigation";
import Button from "@/shared/ui/Button";
import { clearAuth } from "@/features/auth/store/auth";

export default function LogoutButton() {
  const router = useRouter();

  const onLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return <Button label="Logout" variant="ghost" onClick={onLogout} className="px-3 py-2 text-xs" />;
}

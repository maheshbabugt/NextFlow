"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AuthModal } from "../auth/AuthModal";

export function SignUpButton({
  children,
  style,
  mode = "signUp",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  mode?: "signUp" | "signIn";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { userId } = useAuth();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (userId) {
      router.push("/dashboard");
    } else {
      setIsOpen(true);
    }
  }

  return (
    <>
      <button
        style={{ ...style, cursor: "pointer", border: style?.border || "none" }}
        onClick={handleClick}
        onMouseEnter={(e) => { if (style?.backgroundColor === "#ffffff") e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={(e) => { if (style?.backgroundColor === "#ffffff") e.currentTarget.style.opacity = "1"; }}
      >
        {children}
      </button>
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} mode={mode} />
    </>
  );
}

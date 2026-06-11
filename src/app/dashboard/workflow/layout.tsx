"use client";

import { usePathname } from "next/navigation";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWorkflowEditor = pathname?.includes("/workflow/");

  if (isWorkflowEditor) {
    // Completely escape the dashboard layout — cover everything
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#0a0a0a",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

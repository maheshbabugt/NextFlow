"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export function AuthModal({
  isOpen,
  onClose,
  mode = "signUp",
}: {
  isOpen: boolean;
  onClose: () => void;
  mode?: "signUp" | "signIn";
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          backgroundColor: "#ffffff",
          borderRadius: isMobile ? "16px" : "20px",
          overflow: "hidden",
          width: isMobile ? "100%" : "860px",
          maxWidth: isMobile ? "100%" : "95vw",
          maxHeight: isMobile ? "90vh" : "92vh",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
          border: "1px solid #e5e5e5",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: isMobile ? "12px" : "16px",
            right: isMobile ? "12px" : "16px",
            background: "#000",
            color: "#fff",
            width: isMobile ? "28px" : "30px",
            height: isMobile ? "28px" : "30px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            fontSize: isMobile ? "16px" : "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          ✕
        </button>

        {/* LEFT */}
        <div
          style={{
            flex: isMobile ? "1" : "0 0 420px",
            padding: isMobile ? "48px 20px 32px" : "48px 44px 32px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: isMobile ? "calc(90vh - 60px)" : "92vh",
          }}
        >
          <h2
            style={{
              color: "#000",
              fontSize: isMobile ? "22px" : "28px",
              fontWeight: "700",
              marginBottom: isMobile ? "20px" : "28px",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {mode === "signIn" ? "Welcome back" : "Sign up to generate"}
            <br />
            {mode === "signIn" ? "Sign in to continue" : "for free"}
          </h2>

          {mode === "signIn" ? (
            <>
              <SignIn
                routing="hash"
                appearance={{
                  layout: { socialButtonsPlacement: "top" },
                  elements: {
                    card: { backgroundColor: "transparent", boxShadow: "none", width: "100%", padding: "0" },
                    headerTitle: { display: "none" },
                    headerSubtitle: { display: "none" },
                    socialButtonsBlockButton: "!bg-white !text-black !border !border-gray-300 !rounded-full !font-semibold !py-[13px] !w-full !mb-2 hover:!bg-gray-100 active:!bg-gray-100",
                    socialButtonsBlockButtonText: { color: "#000", fontWeight: "600" },
                    socialButtonsBlockButtonIcon: { display: "none" },
                    formField: { border: "none", boxShadow: "none" },
                    cardBox: { boxShadow: "none", border: "none" },
                    dividerLine: { backgroundColor: "#f0f0f0" },
                    formFieldInput: "!bg-white !border !border-gray-300 !text-black !rounded-xl !px-4 !py-3 placeholder:!text-gray-400 focus:!border-black focus:!ring-0 !w-full [WebkitTextFillColor:#000]",
                    formFieldInputShowPasswordIcon: { color: "#000", width: "20px", height: "20px" },
                    formFieldLabel: { color: "#000", fontSize: "13px" },
                    formFieldHintText: { color: "#666" },
                    formButtonPrimary: "!bg-black !text-white !rounded-full !font-semibold !py-[13px] !w-full hover:!bg-[#111]",
                    formButtonPrimaryIcon: { display: "none" },
                    dividerText: { color: "#666" },
                    footer: { display: "none" },
                  },
                  variables: { colorPrimary: "#000", colorText: "#000", colorBackground: "#fff", colorInputText: "#000" },
                }}
              />
              <p
                style={{
                  marginTop: "20px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                By continuing, you agree to Galaxy.ai's <br />
                <a href="#" style={{ color: "#2563eb" }}>
                  Terms of Use
                </a>{" "}
                &{" "}
                <a href="#" style={{ color: "#2563eb" }}>
                  Privacy Policy
                </a>
              </p>
            </>
          ) : (
  <>
    <SignUp
      routing="hash"
      appearance={{
        layout: {
          socialButtonsPlacement: "top",
        },
        elements: {
          card: {
            backgroundColor: "transparent",
            boxShadow: "none",
            width: "100%",
            padding: "0",
          },
          headerTitle: { display: "none" },
          headerSubtitle: { display: "none" },
          socialButtonsBlockButton:
            "!bg-white !text-black !border !border-gray-300 !rounded-full !font-semibold !py-[13px] !w-full !mb-2 hover:!bg-gray-100 active:!bg-gray-100",
          socialButtonsBlockButtonText: {
            color: "#000",
            fontWeight: "600",
          },
          socialButtonsBlockButtonIcon: {
            display: "none",
          },
          formField: {
            border: "none",
            boxShadow: "none",
          },
          cardBox: {
            boxShadow: "none",
            border: "none",
          },
          dividerLine: {
            backgroundColor: "#f0f0f0",
          },
          formFieldInput:
            "!bg-white !border !border-gray-300 !text-black !rounded-xl !px-4 !py-3 placeholder:!text-gray-400 focus:!border-black focus:!ring-0 !w-full [WebkitTextFillColor:#000]",
          formFieldInputShowPasswordIcon: {
            color: "#000",
            width: "20px",
            height: "20px",
          },
          formFieldLabel: {
            color: "#000",
            fontSize: "13px",
          },
          formFieldHintText: {
            color: "#666",
          },
          formButtonPrimary:
            "!bg-black !text-white !rounded-full !font-semibold !py-[13px] !w-full hover:!bg-[#111]",
          formButtonPrimaryIcon: {
            display: "none",
          },
          dividerText: {
            color: "#666",
          },
          footer: { display: "none" },
        },
        variables: {
          colorPrimary: "#000",
          colorText: "#000",
          colorBackground: "#fff",
          colorInputText: "#000",
        },
      }}
    />

    <p
      style={{
        marginTop: "20px",
        textAlign: "center",
        fontSize: "12px",
        color: "#666",
      }}
    >
      By continuing, you agree to Galaxy.ai's <br />
      <a href="#" style={{ color: "#2563eb" }}>
        Terms of Use
      </a>{" "}
      &{" "}
      <a href="#" style={{ color: "#2563eb" }}>
        Privacy Policy
      </a>
    </p>
  </>
)}
        </div>

        {/* RIGHT IMAGE - Hidden on mobile */}
        {!isMobile && (
          <div style={{ flex: 1 }}>
            <img
              src="/images/hero1.png"
              alt="Decorative"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
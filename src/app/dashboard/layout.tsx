"use client";

// Dashboard Layout Component
// This is the main layout wrapper for all dashboard pages
// Handles responsive sidebar (collapsible on mobile) and sticky mobile header
// Also manages onboarding modal on first user sign-in
// IMPORTANT: Shows auth modal for unauthenticated users trying to access protected pages

import Sidebar from "@/components/layout/Sidebar";
import OnboardingModal from "@/components/OnboardingModal";
import { useDisplayName } from "@/hooks/useDisplayName";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { AuthModal } from "@/components/auth/AuthModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { needsOnboarding, loading, completeOnboarding } = useDisplayName();
  const { isSignedIn, isLoaded } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Detect mobile viewport and handle sidebar visibility
  // On mobile: sidebar slides in from left with overlay
  // On desktop: sidebar always visible
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // DO NOT auto-show modal - let user interactions trigger it
  // Modal only shows when user explicitly clicks on protected actions

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .dashboard-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 40;
            transform: translateX(${sidebarOpen ? '0' : '-100%'});
            transition: transform 0.3s ease;
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 30;
            display: ${sidebarOpen ? 'block' : 'none'};
          }
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #0a0a0a;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            position: sticky;
            top: 0;
            z-index: 20;
          }
          .mobile-header-btn {
            background: none;
            border: none;
            color: #fff;
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        @media (min-width: 768px) {
          .dashboard-sidebar {
            position: relative;
            transform: translateX(0) !important;
          }
          .sidebar-overlay {
            display: none !important;
          }
          .mobile-header {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex h-screen w-screen overflow-hidden bg-[#131313]">
        {/* Auth modal for unauthenticated users — shown on main screen, not in sidebar */}
        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)}
            mode="signUp"
          />
        )}

        {/* Onboarding modal — shown once on first sign-in */}
        {!loading && needsOnboarding && isSignedIn && (
          <OnboardingModal onComplete={completeOnboarding} />
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobile && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <Sidebar onAuthRequired={() => setShowAuthModal(true)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {/* Mobile Header */}
          {isMobile && (
            <div className="mobile-header">
              <button
                className="mobile-header-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <div style={{ width: "40px" }} />
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
}

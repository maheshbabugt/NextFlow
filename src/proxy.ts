import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/dashboard", // home dashboard is public — sub-pages are still protected
  "/auth/sign-in(.*)",
  "/auth/sign-up(.*)",
  "/api/image-proxy(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect everything except explicitly public routes.
  // Previously only API routes were protected — dashboard pages were missing,
  // which caused the "sign in again" loop when navigating to /dashboard/*.
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000' }}>
      {/* routing="path" is required for Next.js App Router */}
      <SignUp routing="path" path="/auth/sign-up" forceRedirectUrl="/dashboard" />
    </div>
  );
}
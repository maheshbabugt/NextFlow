import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#000' }}>
      {/* routing="path" is required for Next.js App Router — "hash" routing
          breaks session persistence because Clerk cannot read the callback
          URL from a hash fragment on the server side. */}
      <SignIn routing="path" path="/auth/sign-in" forceRedirectUrl="/dashboard" />
    </div>
  );
}
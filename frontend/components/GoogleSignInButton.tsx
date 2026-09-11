// components/GoogleSignInButton.tsx
"use client";

import { IconGoogle } from "./icons";

/**
 * This button is STRUCTURALLY real (correct Google branding guidelines,
 * correct click handler seam) but FUNCTIONALLY inert without real
 * credentials — see file header in hooks/useAuth.ts for why.
 *
 * TO MAKE THIS WORK FOR REAL, you need to:
 *   1. Create a project in Google Cloud Console -> APIs & Services -> Credentials
 *   2. Create an OAuth 2.0 Client ID (type: Web application)
 *   3. Add authorized redirect URI: http://localhost:3000/api/auth/callback/google
 *      (or your deployed URL's equivalent)
 *   4. Set these in .env.local:
 *        NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your client id>
 *        GOOGLE_CLIENT_SECRET=<your client secret>   (server-side only, no NEXT_PUBLIC_ prefix)
 *   5. Implement the actual OAuth code exchange — either via next-auth
 *      (recommended: `npm install next-auth` and configure a Google
 *      provider) or a custom Spring Security OAuth2 client on the backend
 *      (re-enable spring-boot-starter-oauth2-resource-server in pom.xml).
 *
 * Until those exist, clicking this button shows an honest inline message
 * rather than pretending to authenticate.
 */
export function GoogleSignInButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex w-full items-center justify-center gap-2.5 rounded-md border border-graphite-600 bg-graphite-850 py-2.5 text-[13px] font-medium text-graphite-100 transition-colors hover:bg-graphite-800"
    >
      <IconGoogle className="h-4 w-4" />
      Continue with Google
    </button>
  );
}

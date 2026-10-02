"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { setPasswordModeForType, setPasswordPath } from "@/lib/auth-links";

const LINK_EXPIRED = "/login?error=link_expired";

export default function AuthConfirmPage() {
  useEffect(() => {
    // Read the fragment before creating the client: the browser client may
    // consume and clear it during initialisation.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);

    if (
      hash.get("error") ||
      hash.get("error_code") ||
      query.get("error") ||
      query.get("error_code")
    ) {
      window.location.replace(LINK_EXPIRED);
      return;
    }

    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const type = hash.get("type");

    if (!accessToken || !refreshToken) {
      window.location.replace(LINK_EXPIRED);
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          window.location.replace(LINK_EXPIRED);
          return;
        }
        const mode = setPasswordModeForType(type);
        window.location.replace(mode ? setPasswordPath(mode) : "/");
      });
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center bg-muted/40 p-4">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}

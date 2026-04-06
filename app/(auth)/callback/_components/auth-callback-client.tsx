"use client";

import { useEffect } from "react";

export function AuthCallbackClient({
  destination,
}: {
  destination: string;
}) {
  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">Redirecionando...</p>
    </div>
  );
}

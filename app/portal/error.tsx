"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PortalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <Card className="p-2">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-destructive" />
            <CardTitle className="text-xl">Something went wrong</CardTitle>
          </div>
          <CardDescription>
            {error.digest
              ? `An unexpected error occurred (ref: ${error.digest}). Please try again.`
              : "An unexpected error occurred. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => unstable_retry()} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

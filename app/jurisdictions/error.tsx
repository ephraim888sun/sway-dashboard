"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Jurisdictions page error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Failed to load jurisdictions</CardTitle>
          <CardDescription>
            An error occurred while loading the jurisdictions data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

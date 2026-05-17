import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function PlansLoading({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-6 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          <Skeleton className="h-10 w-full mt-2" />
        </div>
      ))}
      <div className="col-span-full flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
      </div>
    </div>
  );
}

export function PlansError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div className="glass rounded-2xl p-10 text-center max-w-xl mx-auto" role="alert">
      <div className="w-12 h-12 mx-auto rounded-full bg-destructive/15 text-destructive flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold">We couldn't load these plans</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {message || "Something went wrong while reaching our servers. Please check your connection and try again."}
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-5 gap-2">
        <RefreshCw className="w-4 h-4" /> Try again
      </Button>
    </div>
  );
}

export function PlansEmpty() {
  return (
    <div className="glass rounded-2xl p-10 text-center max-w-xl mx-auto">
      <div className="w-12 h-12 mx-auto rounded-full bg-primary/15 text-primary flex items-center justify-center mb-4">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold">No plans available yet</h3>
      <p className="text-sm text-muted-foreground mt-2">
        New packages are coming soon. Check back shortly or contact support if you're expecting one here.
      </p>
    </div>
  );
}

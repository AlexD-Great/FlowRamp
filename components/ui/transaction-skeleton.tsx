import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-24 ml-auto" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-16" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsGridSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <TransactionListSkeleton count={5} />
        </CardContent>
      </Card>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

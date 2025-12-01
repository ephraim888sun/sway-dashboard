import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </Card>
      </div>
    </div>
  );
}

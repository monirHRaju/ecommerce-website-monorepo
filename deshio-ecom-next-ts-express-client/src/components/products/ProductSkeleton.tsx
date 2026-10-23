export default function ProductSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-stone-200/80 overflow-hidden animate-pulse">
      {/* Media skeleton (3:4 portrait) */}
      <div className="aspect-[3/4] w-full bg-stone-200/70" />

      {/* Info skeleton */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="h-3 w-20 rounded bg-stone-200" />
        <div className="h-4 w-full rounded bg-stone-200" />
        <div className="h-4 w-3/4 rounded bg-stone-200" />
        <div className="flex gap-1 mt-1">
          <div className="h-3 w-16 rounded bg-stone-200" />
        </div>
        <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="h-5 w-20 rounded bg-stone-200" />
          <div className="h-7 w-16 rounded bg-stone-200" />
        </div>
      </div>
    </div>
  );
}

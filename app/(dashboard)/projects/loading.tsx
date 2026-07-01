export default function ProjectsLoading() {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-2.5 w-24 bg-surface-container rounded mb-2 animate-pulse" />
          <div className="h-7 w-32 bg-surface-container rounded animate-pulse" />
          <div className="h-4 w-20 bg-surface-container rounded mt-2 animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-surface-container rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel p-7 animate-pulse">
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded bg-surface-container" />
              <div className="h-4 w-12 bg-surface-container rounded" />
            </div>
            <div className="h-5 w-3/4 bg-surface-container rounded mb-2" />
            <div className="h-4 w-full bg-surface-container rounded mb-1" />
            <div className="h-4 w-2/3 bg-surface-container rounded mb-5" />
            <div className="pt-5 border-t border-outline-variant/20 space-y-4">
              <div className="h-1 bg-surface-container rounded-full" />
              <div className="h-1 bg-surface-container rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

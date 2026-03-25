type SkeletonProps = {
  lines?: number;
  className?: string;
};

export function Skeleton({ lines = 1, className = "" }: SkeletonProps) {
  return (
    <div className={`mm-skeleton ${className}`.trim()}>
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} className="mm-skeleton-line" />
      ))}
    </div>
  );
}

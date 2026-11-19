type ValueSkeletonProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function ValueSkeleton({
  size = "md",
  className = "",
}: ValueSkeletonProps) {
  return (
    <span
      className={`value-skeleton value-skeleton-${size} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

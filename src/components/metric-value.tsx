import type { ReactNode } from "react";
import ValueSkeleton from "@/components/value-skeleton";

type MetricValueProps = {
  loading: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
};

export default function MetricValue({
  loading,
  size = "md",
  className = "",
  children,
}: MetricValueProps) {
  if (loading) {
    return <ValueSkeleton size={size} className={className} />;
  }

  return <span className={className}>{children}</span>;
}

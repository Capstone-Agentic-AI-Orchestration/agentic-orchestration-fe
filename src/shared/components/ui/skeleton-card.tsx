"use client";

/**
 * Loading skeleton components for data-fetching views.
 * Provides shimmer animation placeholders for cards, tables, lists, and stats.
 */

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, borderRadius = 6, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function SkeletonText({ lines = 3, width = "100%" }: { lines?: number; width?: string | number }) {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : width}
          height={12}
          style={{ marginBottom: i < lines - 1 ? 8 : 0 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div className="card skeleton-card" style={{ padding: 20 }}>
      <Skeleton width={40} height={40} borderRadius={10} />
      <Skeleton width="40%" height={12} style={{ marginTop: 16 }} />
      <Skeleton width="60%" height={22} style={{ marginTop: 8 }} />
      <Skeleton width="30%" height={10} style={{ marginTop: 8 }} />
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-stat-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} width="20%" height={14} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, ri) => (
        <div key={ri} className="skeleton-table-row">
          {Array.from({ length: cols }, (_, ci) => (
            <Skeleton key={ci} width={ci === 0 ? "30%" : "20%"} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton width={36} height={36} borderRadius={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={10} style={{ marginTop: 6 }} />
          </div>
          <Skeleton width={60} height={24} borderRadius={12} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonOrchestrationPanel() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row gap-3" style={{ alignItems: "center", marginBottom: 16 }}>
        <Skeleton width={40} height={40} borderRadius={10} />
        <div style={{ flex: 1 }}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="50%" height={10} style={{ marginTop: 4 }} />
        </div>
        <Skeleton width={60} height={20} borderRadius={10} />
      </div>
      <Skeleton height={100} borderRadius={8} />
      <div className="row gap-2" style={{ marginTop: 12 }}>
        <Skeleton width={50} height={20} borderRadius={6} />
        <Skeleton width={50} height={20} borderRadius={6} />
        <Skeleton width={50} height={20} borderRadius={6} />
      </div>
    </div>
  );
}

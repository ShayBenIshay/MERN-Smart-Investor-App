import React from "react";
import "./Skeleton.css";

const Skeleton = React.memo(
  ({
    width = "100%",
    height = "20px",
    borderRadius = "4px",
    className = "",
  }) => {
    return (
      <div
        className={`skeleton ${className}`}
        style={{
          width,
          height,
          borderRadius,
        }}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Pre-built skeleton components for common use cases
export const SkeletonText = React.memo(({ lines = 1, className = "" }) => (
  <div className={`skeleton-text ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        height="16px"
        width={i === lines - 1 ? "70%" : "100%"}
        className="skeleton-line"
      />
    ))}
  </div>
));

SkeletonText.displayName = "SkeletonText";

export const SkeletonCard = React.memo(({ className = "" }) => (
  <div className={`skeleton-card ${className}`}>
    <Skeleton height="120px" borderRadius="8px" className="skeleton-image" />
    <div className="skeleton-content">
      <Skeleton height="20px" width="80%" />
      <SkeletonText lines={2} />
    </div>
  </div>
));

SkeletonCard.displayName = "SkeletonCard";

export default Skeleton;

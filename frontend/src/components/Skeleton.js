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

export const PortfolioTableSkeleton = React.memo(({ className = "" }) => (
  <div className={`portfolio-skeleton-container ${className}`}>
    <div className="portfolio-skeleton-controls">
      <Skeleton height="32px" width="120px" borderRadius="4px" />
    </div>
    <table className="portfolio-skeleton-table">
      <thead>
        <tr>
          <th>
            <Skeleton height="16px" width="60px" />
          </th>
          <th>
            <Skeleton height="16px" width="100px" />
          </th>
          <th>
            <Skeleton height="16px" width="80px" />
          </th>
          <th>
            <Skeleton height="16px" width="80px" />
          </th>
          <th>
            <Skeleton height="16px" width="90px" />
          </th>
          <th>
            <Skeleton height="16px" width="90px" />
          </th>
          <th>
            <Skeleton height="16px" width="100px" />
          </th>
          <th>
            <Skeleton height="16px" width="70px" />
          </th>
          <th>
            <Skeleton height="16px" width="70px" />
          </th>
          <th>
            <Skeleton height="16px" width="100px" />
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 8 }, (_, i) => (
          <tr key={i} className="portfolio-skeleton-row">
            <td>
              <Skeleton height="16px" width="50px" />
            </td>
            <td>
              <Skeleton height="16px" width="80px" />
            </td>
            <td>
              <Skeleton height="16px" width="60px" />
            </td>
            <td>
              <Skeleton height="16px" width="80px" />
            </td>
            <td>
              <Skeleton height="16px" width="90px" />
            </td>
            <td>
              <Skeleton height="16px" width="90px" />
            </td>
            <td>
              <Skeleton height="32px" width="80px" borderRadius="4px" />
            </td>
            <td>
              <Skeleton height="16px" width="70px" />
            </td>
            <td>
              <Skeleton height="16px" width="60px" />
            </td>
            <td>
              <Skeleton height="32px" width="120px" borderRadius="4px" />
            </td>
          </tr>
        ))}
        {/* Totals row */}
        <tr className="portfolio-skeleton-totals">
          <td>
            <Skeleton height="18px" width="70px" />
          </td>
          <td>
            <Skeleton height="16px" width="20px" />
          </td>
          <td>
            <Skeleton height="16px" width="20px" />
          </td>
          <td>
            <Skeleton height="16px" width="20px" />
          </td>
          <td>
            <Skeleton height="18px" width="100px" />
          </td>
          <td>
            <Skeleton height="18px" width="100px" />
          </td>
          <td>
            <Skeleton height="16px" width="20px" />
          </td>
          <td>
            <Skeleton height="16px" width="20px" />
          </td>
          <td>
            <Skeleton height="16px" width="20px" />
          </td>
          <td>
            <Skeleton height="16px" width="20px" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
));

PortfolioTableSkeleton.displayName = "PortfolioTableSkeleton";

export default Skeleton;

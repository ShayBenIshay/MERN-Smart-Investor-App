import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = React.memo(
  ({ size = "medium", message = "Loading..." }) => {
    return (
      <div className="loading-container">
        <div className={`loading-spinner ${size}`}></div>
        <p className="loading-message">{message}</p>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;

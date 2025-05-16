import React from "react";
import "./Spinner.styles.scss";

interface SpinnerProps {
  isLoading: boolean;
  label?: string; // Optional label
}

const Spinner: React.FC<SpinnerProps> = ({ isLoading, label }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="overlay">
      <div className="loader">
        {/* Loader circle */}
        <div className="spinner"></div>
        {label && <div className="loader-label">{label}</div>}
      </div>
    </div>
  );
};

export default Spinner;

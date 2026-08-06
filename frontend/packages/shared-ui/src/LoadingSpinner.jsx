import React from 'react';

const SIZE_PX = {
  small: 20,
  medium: 36,
  large: 56,
};

/**
 * A simple centered loading spinner.
 * @param {{size?: 'small'|'medium'|'large'|number, label?: string}} props
 */
export function LoadingSpinner({ size = 'medium', label = 'Loading...' }) {
  const dimension = typeof size === 'number' ? size : SIZE_PX[size] || SIZE_PX.medium;

  return (
    <div className="sad-spinner-container" role="status" aria-live="polite">
      <span
        className="sad-spinner"
        style={{ width: dimension, height: dimension }}
        aria-hidden="true"
      />
      {label ? <span className="sad-spinner-label">{label}</span> : null}
    </div>
  );
}

export default LoadingSpinner;

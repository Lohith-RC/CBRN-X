import React from 'react';

/**
 * CSS-only ambient background: static gradient field with a fixed perspective
 * grid. Replaces the previous animated WebGL canvas — no GPU loop, no bundle
 * weight, and it disappears entirely in print and reduced-motion contexts.
 */
export default function DashboardBackground() {
  return <div className="ambient-background" aria-hidden="true" />;
}

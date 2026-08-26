import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostProcessing from '../PostProcessing.jsx';

describe('PostProcessing Component', () => {
  const defaultProps = {
    cursorPos: { x: 500, y: 300 },
    isActive: false,
    screenShake: false,
    visorActive: false,
    beatIndex: -1,
  };

  it('renders without crashing', () => {
    render(<PostProcessing {...defaultProps} />);
    const container = document.querySelector('.post-processing-container');
    expect(container).toBeInTheDocument();
  });

  it('applies screen shake class when active', () => {
    render(<PostProcessing {...defaultProps} isActive={true} screenShake={true} />);
    const container = document.querySelector('.post-processing-container');
    expect(container?.classList.contains('shake-active')).toBe(true);
  });

  it('applies visor overlay when active', () => {
    render(<PostProcessing {...defaultProps} isActive={true} visorActive={true} />);
    const container = document.querySelector('.post-processing-container');
    expect(container?.classList.contains('visor-active')).toBe(true);
  });

  it('applies color grade based on beat index', () => {
    render(<PostProcessing {...defaultProps} isActive={true} beatIndex={0} />);
    const container = document.querySelector('.post-processing-container');
    expect(container?.classList.contains('grade-cctv')).toBe(true);
  });
});

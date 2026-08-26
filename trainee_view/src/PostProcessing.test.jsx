import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import PostProcessing from './PostProcessing.jsx';

describe('PostProcessing Component', () => {
  const defaultProps = {
    cursorPos: { x: 500, y: 300 },
    isActive: false,
    screenShake: false,
    visorActive: false,
    beatIndex: -1,
  };

  it('renders canvas element without crashing', () => {
    const { container } = render(<PostProcessing {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies absolute positioning and pointerEvents none on canvas', () => {
    const { container } = render(<PostProcessing {...defaultProps} isActive={true} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveStyle({ position: 'absolute', pointerEvents: 'none' });
  });

  it('renders correctly with active visor and screen shake props', () => {
    const { container } = render(
      <PostProcessing {...defaultProps} isActive={true} screenShake={true} visorActive={true} beatIndex={2} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hotspots from '../Hotspots.jsx';

vi.mock('../../trainee_view/src/CursorParallax.js', () => ({
  useCursorParallax: () => ({
    subscribe: vi.fn(),
    depth: 12,
  }),
  CursorParallaxLayer: ({ children }) => children,
}));

describe('Hotspots Component', () => {
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hotspots for BEAT_1_BRIEFING', () => {
    render(<Hotspots stage="BEAT_1_BRIEFING" onAction={mockOnAction} />);
    expect(screen.getByText(/BEGIN SCENARIO/i)).toBeInTheDocument();
  });

  it('renders hotspots for BEAT_3_CONSOLE', () => {
    render(<Hotspots stage="BEAT_3_CONSOLE" onAction={mockOnAction} />);
    expect(screen.getByText(/INSPECT CONSOLE/i)).toBeInTheDocument();
  });

  it('renders hotspots for BEAT_5_SUIT', () => {
    render(<Hotspots stage="BEAT_5_SUIT" onAction={mockOnAction} />);
    expect(screen.getByText(/EQUIP SUIT/i)).toBeInTheDocument();
  });

  it('does not render hotspots for unknown stage', () => {
    render(<Hotspots stage="UNKNOWN_STAGE" onAction={mockOnAction} />);
    expect(screen.getByText(/No hotspots available/i)).toBeInTheDocument();
  });
});

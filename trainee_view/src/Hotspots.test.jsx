import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Hotspots, { STAGE_HOTSPOTS } from './Hotspots.jsx';

vi.mock('./CursorParallax', () => ({
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

  it('renders hotspot markers for BEAT_1_BRIEFING and reveals tooltip on hover', () => {
    const { container } = render(<Hotspots stage="BEAT_1_BRIEFING" onAction={mockOnAction} />);
    const hotspotElements = container.querySelectorAll('div[style*="cursor: pointer"]');
    expect(hotspotElements.length).toBe(STAGE_HOTSPOTS.BEAT_1_BRIEFING.length);

    // Hover over the first hotspot to trigger tooltip
    fireEvent.mouseEnter(hotspotElements[0]);
    expect(screen.getByText(/BEGIN SCENARIO/i)).toBeInTheDocument();
  });

  it('triggers onAction callback on click', () => {
    const { container } = render(<Hotspots stage="BEAT_1_BRIEFING" onAction={mockOnAction} />);
    const hotspotElements = container.querySelectorAll('div[style*="cursor: pointer"]');

    fireEvent.click(hotspotElements[0]);
    expect(mockOnAction).toHaveBeenCalledWith('BEGIN_SCENARIO');
  });

  it('renders hotspot markers for BEAT_3_CONSOLE and reveals tooltip on hover', () => {
    const { container } = render(<Hotspots stage="BEAT_3_CONSOLE" onAction={mockOnAction} />);
    const hotspotElements = container.querySelectorAll('div[style*="cursor: pointer"]');
    expect(hotspotElements.length).toBe(STAGE_HOTSPOTS.BEAT_3_CONSOLE.length);

    fireEvent.mouseEnter(hotspotElements[0]);
    expect(screen.getByText(/ENVIRONMENTAL TELEMETRY CONSOLE/i)).toBeInTheDocument();
  });

  it('renders hotspot markers for BEAT_5_SUIT and triggers action', () => {
    const { container } = render(<Hotspots stage="BEAT_5_SUIT" onAction={mockOnAction} />);
    const hotspotElements = container.querySelectorAll('div[style*="cursor: pointer"]');
    expect(hotspotElements.length).toBe(STAGE_HOTSPOTS.BEAT_5_SUIT.length);

    fireEvent.click(hotspotElements[0]);
    expect(mockOnAction).toHaveBeenCalledWith('ZIP_SUIT');
  });

  it('renders empty container for unknown stage without throwing', () => {
    const { container } = render(<Hotspots stage="UNKNOWN_STAGE" onAction={mockOnAction} />);
    const hotspotElements = container.querySelectorAll('div[style*="cursor: pointer"]');
    expect(hotspotElements.length).toBe(0);
  });
});

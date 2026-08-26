import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MetricCards from '../MetricCards.jsx';

describe('MetricCards Component', () => {
  const mockStats = {
    totalTrainees: 12,
    totalSessionsCompleted: 8,
    overallPassRate: 87.5,
    averageScore: 84.2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders metric cards with stats', () => {
    render(<MetricCards stats={mockStats} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText('84.2')).toBeInTheDocument();
  });

  it('renders fallback stats when no stats provided', () => {
    render(<MetricCards stats={null} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('displays metric labels', () => {
    render(<MetricCards stats={mockStats} />);
    expect(screen.getByText(/Total Trainees/i)).toBeInTheDocument();
    expect(screen.getByText(/Sessions Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Pass Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Score/i)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MetricCards from '../components/MetricCards';

describe('MetricCards Component', () => {
  it('renders all four metric cards correctly', () => {
    const stats = { overallPassRate: 92.5 };
    render(<MetricCards stats={stats} />);

    expect(screen.getByText('Hot-Zone Responders')).toBeInTheDocument();
    expect(screen.getByText('Active Mission Duration')).toBeInTheDocument();
    expect(screen.getByText('Protocol Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('Atmospheric Toxicity Level')).toBeInTheDocument();
    expect(screen.getByText('4 Deployed')).toBeInTheDocument();
    expect(screen.getByText('0.02 ppm')).toBeInTheDocument();
  });
});

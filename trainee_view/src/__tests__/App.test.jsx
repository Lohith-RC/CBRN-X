import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Trainee View App Component', () => {
  it('renders trainee portal header and simulation station controls', () => {
    render(<App />);

    expect(screen.getByText(/CBRN TACTICAL SIMULATION STATION/i)).toBeInTheDocument();
    const buttons = screen.getAllByText(/INITIATE DEPLOYMENT/i);
    expect(buttons.length).toBeGreaterThan(0);
  });
});

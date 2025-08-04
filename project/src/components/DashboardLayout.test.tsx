import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardLayout from './DashboardLayout';

// Mock window.matchMedia for dark mode
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
});

describe('DashboardLayout', () => {
  it('renders sidebar navigation', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('ClipChef')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders usage statistics cards', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('Clips Created')).toBeInTheDocument();
    expect(screen.getByText('Storage Used')).toBeInTheDocument();
    expect(screen.getByText('Processing Time')).toBeInTheDocument();
  });

  it('renders recent uploads grid', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('Recent Uploads')).toBeInTheDocument();
    expect(screen.getByText('Podcast Episode 12.mp4')).toBeInTheDocument();
    expect(screen.getByText('Vlog.mov')).toBeInTheDocument();
    expect(screen.getByText('Tutorial.webm')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Upload Video')).toBeInTheDocument();
    expect(screen.getByText('View Library')).toBeInTheDocument();
  });

  it('collapses and expands sidebar sections', () => {
    render(<DashboardLayout />);
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);
    // After collapse, links should not be visible
    expect(screen.queryByText('Account')).not.toBeInTheDocument();
    expect(screen.queryByText('Preferences')).not.toBeInTheDocument();
    // Expand again
    fireEvent.click(settingsButton);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });
});

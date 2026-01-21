import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import * as api from './api';

// Mock API to prevent unhandled state updates
vi.mock('./api', () => ({
  fetchSession: vi
    .fn()
    .mockResolvedValue({ hasSession: true, visits: 1, userId: 'test-user-id' }),
  fetchHealth: vi.fn().mockResolvedValue({ status: 'ok' }),
  fetchProjects: vi.fn().mockResolvedValue([]),
  fetchProject: vi
    .fn()
    .mockResolvedValue({ id: 'project-1', name: 'Test Project' }),
  fetchConditions: vi.fn().mockResolvedValue([]),
  fetchFeatures: vi.fn().mockResolvedValue([]),
  fetchFeature: vi
    .fn()
    .mockResolvedValue({ id: 'feature-1', name: 'Test Feature' }),
  fetchRequirements: vi.fn().mockResolvedValue([]),
  fetchKeys: vi.fn().mockResolvedValue([]),
  fetchProjectRequirements: vi.fn().mockResolvedValue([]),
  login: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ id: 'new-user' }),
  logout: vi.fn(),
}));

describe('App', () => {
  it('initializes the application environment', async () => {
    // We render the App, but the diag-ui sentinel is in index.html (simulated here)
    document.body.innerHTML =
      '<div id="diag-ui">SMRT-V1-READY</div><div id="root"></div>';
    render(<App />);

    await waitFor(() => {
      const sentinel = document.getElementById('diag-ui');
      expect(sentinel).toBeTruthy();
      expect(sentinel?.textContent).toBe('SMRT-V1-READY');
    });
  });

  it('renders the core layout containers', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.querySelector('main')).toBeTruthy();
      expect(container.querySelector('nav')).toBeTruthy();
    });
  });

  it('renders breadcrumbs with mapped names', async () => {
    // Navigate to a feature URL directly
    window.history.pushState(
      {},
      'Test Feature',
      '/projects/project-1/features/feature-1',
    );

    // Update mocks for feature
    vi.mocked(api.fetchFeature).mockResolvedValue({
      id: 'feature-1',
      name: 'Test Feature',
    });

    render(<App />);

    await waitFor(() => {
      // Should show 'Home', 'Projects', 'Test Project', 'Features', and 'Test Feature'
      expect(screen.getByLabelText('breadcrumb-home')).toBeTruthy();
      expect(screen.getByLabelText('breadcrumb-projects')).toBeTruthy();
      expect(screen.getByText('Test Project')).toBeTruthy();
      expect(screen.getByLabelText('breadcrumb-features')).toBeTruthy();
      expect(screen.getByLabelText('breadcrumb-active').textContent).toBe(
        'Test Feature',
      );
    });

    // Verify links
    expect(screen.getByLabelText('breadcrumb-home').getAttribute('href')).toBe(
      '/',
    );
    expect(
      screen.getByLabelText('breadcrumb-projects').getAttribute('href'),
    ).toBe('/projects');

    // Project link
    const projectLink = screen.getByText('Test Project').closest('a');
    expect(projectLink?.getAttribute('href')).toBe('/projects/project-1');

    // Features link should point to project tab 2
    const featuresLink = screen.getByLabelText('breadcrumb-features');
    expect(featuresLink.getAttribute('href')).toBe('/projects/project-1?tab=2');
  });
});

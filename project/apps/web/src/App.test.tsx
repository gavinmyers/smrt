import { render, waitFor, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

// Mock API to prevent unhandled state updates
vi.mock('./api', () => ({
  fetchSession: vi
    .fn()
    .mockResolvedValue({ hasSession: true, visits: 1, userId: 'test-user-id' }),
  fetchHealth: vi.fn().mockResolvedValue({ status: 'ok' }),
  fetchProjects: vi.fn().mockResolvedValue([]),
  fetchProject: vi.fn().mockResolvedValue({ id: 'project-1', name: 'Test Project' }),
  fetchConditions: vi.fn().mockResolvedValue([]),
  fetchFeatures: vi.fn().mockResolvedValue([]),
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
    // Navigate to a project URL directly
    window.history.pushState({}, 'Test Project', '/projects/project-1');
    
    render(<App />);

    await waitFor(() => {
      // Should show 'Home', 'Projects', and the project name 'Test Project'
      expect(screen.getByLabelText('breadcrumb-home')).toBeTruthy();
      expect(screen.getByLabelText('breadcrumb-projects')).toBeTruthy();
      expect(screen.getByLabelText('breadcrumb-active').textContent).toBe('Test Project');
      // It should NOT show the ID 'project-1'
      expect(screen.queryByText('project-1')).toBeNull();
    });

    // Verify links
    const homeLink = screen.getByLabelText('breadcrumb-home');
    expect(homeLink.getAttribute('href')).toBe('/');

    const projectsLink = screen.getByLabelText('breadcrumb-projects');
    expect(projectsLink.getAttribute('href')).toBe('/projects');
  });
});

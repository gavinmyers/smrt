import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

// Mock API to prevent unhandled state updates
vi.mock('./api', () => ({
  fetchSession: vi
    .fn()
    .mockResolvedValue({ hasSession: true, visits: 1, userId: 'test-user-id' }),
  fetchHealth: vi.fn().mockResolvedValue({ status: 'ok' }),
  fetchProjects: vi.fn().mockResolvedValue([]),
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
});

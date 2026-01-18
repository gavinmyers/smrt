import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import App from './App';

describe('App', () => {
  it('renders correctly', () => {
    render(<App />);
    expect(
      screen.getByText('Vite + React + MUI + Fastify'),
    ).toBeInTheDocument();
  });

  it('increments count on click', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count is 0/i });
    fireEvent.click(button);
    expect(button).toHaveTextContent('Count is 1');
  });
});

import { AuthProvider } from '@/lib/auth';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Profile from '@/nova/pages/Profile';

afterEach(cleanup);

function openParentalControls() {
  render(<AuthProvider><Profile onLogout={() => undefined} /></AuthProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Settings & Help' }));
  fireEvent.click(screen.getByRole('button', { name: /Parental Controls/ }));
  fireEvent.click(screen.getByRole('switch', { name: 'Require PIN for Kids profile' }));
}

describe('Parental PIN setup', () => {
  it('opens the keypad immediately with four empty digits when switched on', () => {
    openParentalControls();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('0 of 4 PIN digits entered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
  });

  it('requires exactly four digits before confirming the toggle', () => {
    openParentalControls();
    for (const digit of ['1', '2', '3']) fireEvent.click(screen.getByRole('button', { name: digit }));
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByLabelText('4 of 4 PIN digits entered')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps parental controls off if setup is cancelled', () => {
    openParentalControls();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel PIN setup' }));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });
});
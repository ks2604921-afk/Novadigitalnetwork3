import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WhosWatching from '@/nova/components/WhosWatching';
import { loadProfiles } from '@/nova/profile-store';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TV profile selection page', () => {
  it('renders full-screen NOVA branding, Who’s Watching heading, Kids profile, and Add Profile button without tagline or hint text', () => {
    render(<WhosWatching tvMode allowEdit={false} onPick={vi.fn()} />);

    const root = screen.getByTestId('tv-profile-selection');
    expect(root.className).toContain('min-h-dvh');
    expect(root.className).toContain('w-screen');
    expect(root.querySelectorAll('img').length).toBe(0);
    expect(screen.getByLabelText('NOVA')).toBeInTheDocument();
    expect(screen.queryByText('YOUR ENTERTAINMENT UNIVERSE')).toBeNull();
    expect(screen.queryByText(/Use arrow keys or hover to preview profiles/i)).toBeNull();
    expect(screen.getByRole('heading', { name: "Who's Watching?" })).toBeInTheDocument();
    expect(screen.getByText('Choose your profile to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Watch as Pranaay Mi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Watch as Kids' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add profile' })).toBeInTheDocument();
  });

  it('expands the hovered or focused profile into a pill card and supports three-dot menu actions', () => {
    render(<WhosWatching tvMode allowEdit={false} onPick={vi.fn()} />);

    const firstItem = screen.getByRole('button', { name: 'Watch as Pranaay Mi' }).closest('[data-profile-id]');
    const kidsItem = screen.getByRole('button', { name: 'Watch as Kids' }).closest('[data-profile-id]');
    expect(firstItem).toHaveAttribute('data-profile-expanded', 'true');
    expect(kidsItem).toHaveAttribute('data-profile-expanded', 'false');

    fireEvent.mouseEnter(kidsItem!);
    expect(kidsItem).toHaveAttribute('data-profile-expanded', 'true');
    expect(firstItem).toHaveAttribute('data-profile-expanded', 'false');

    fireEvent.mouseEnter(firstItem!);
    fireEvent.click(screen.getByRole('button', { name: 'Profile options for Pranaay Mi' }));
    expect(screen.getByRole('menuitem', { name: 'Edit Profile' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Rename Profile' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Change Avatar' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete Profile' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename Profile' }));
    const input = screen.getByLabelText('Profile name');
    fireEvent.change(input, { target: { value: 'Aarav' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Name' }));

    expect(screen.getByRole('button', { name: 'Watch as Aarav' })).toBeInTheDocument();
    expect(loadProfiles().some((p) => p.name === 'Aarav')).toBe(true);
  });

  it('changes avatar and enters home smoothly when a profile is picked', async () => {
    const onPick = vi.fn();
    render(<WhosWatching tvMode allowEdit={false} onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Profile options for Pranaay Mi' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Change Avatar' }));
    expect(screen.getAllByRole('button', { name: /^Select avatar / })).toHaveLength(10);
    expect(screen.getByRole('button', { name: 'Select avatar Normal' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select avatar Iron Hero' }));
    expect(loadProfiles()[0]?.avatar).toBe('iron-hero');

    fireEvent.click(screen.getByRole('button', { name: 'Watch as Pranaay Mi' }));
    await waitFor(() => expect(onPick).toHaveBeenCalledWith('p1'));
  });
});

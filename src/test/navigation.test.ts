import { describe, expect, it } from 'vitest';
import { navItemsFor } from '@/nova/navigation';

describe('navigation per device', () => {
  it('TV and desktop apps hide Clime and Coming Soon', () => {
    expect(navItemsFor(true).map((i) => i.id)).toEqual(['search', 'home', 'profile']);
  });

  it('phone app keeps Clime and Coming Soon', () => {
    expect(navItemsFor(false).map((i) => i.id)).toEqual(['search', 'clips', 'home', 'coming-soon', 'profile']);
  });
});

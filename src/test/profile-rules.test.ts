import { describe, expect, it } from 'vitest';
import { createProfileDraft, insertBeforeKids, orderProfiles, PROFILE_AVATARS, removeProfile, TRIAL_OFFER } from '@/nova/profile-rules';

describe('NOVA profile and trial rules', () => {
  it('inserts every additional profile between the first profile and Kids in creation order', () => {
    const profiles = [{ name: 'First', kid: false }, { name: 'Kids', kid: true }];
    const firstAddition = insertBeforeKids(profiles, { name: 'Extra 1', kid: false });
    const secondAddition = insertBeforeKids(firstAddition, { name: 'Extra 2', kid: false });
    expect(secondAddition.map((profile) => profile.name)).toEqual(['First', 'Extra 1', 'Extra 2', 'Kids']);
  });

  it('offers one month of trial for exactly ₹1', () => {
    expect(TRIAL_OFFER.priceRupees).toBe(1);
    expect(TRIAL_OFFER.durationMonths).toBe(1);
  });

  it('keeps any number of new profiles after First and before Kids', () => {
    let profiles = [{ name: 'First', kid: false }, { name: 'Kids', kid: true }];
    for (let index = 1; index <= 30; index++) {
      profiles = insertBeforeKids(profiles, { name: `Extra ${index}`, kid: false });
    }
    expect(profiles.map((profile) => profile.name)).toEqual(['First', ...Array.from({ length: 30 }, (_, index) => `Extra ${index + 1}`), 'Kids']);
  });

  it('places previously saved profiles between First and Kids', () => {
    expect(orderProfiles([{ name: 'First', kid: false }, { name: 'Kids', kid: true }, { name: 'Extra', kid: false }]).map(profile => profile.name)).toEqual(['First', 'Extra', 'Kids']);
  });

  it('defines the post-trial offer as Standard at ₹40 each month', () => {
    expect(TRIAL_OFFER.renewalPlan).toBe('Standard');
    expect(TRIAL_OFFER.renewalPriceRupees).toBe(40);
    expect(TRIAL_OFFER.renewalIntervalMonths).toBe(1);
  });

  it('deletes the chosen profile only', () => {
    const profiles = [{ id: 'a', kid: false }, { id: 'b', kid: false }, { id: 'k', kid: true }];
    expect(removeProfile(profiles, 'b').map(p => p.id)).toEqual(['a', 'k']);
  });

  it('never deletes the last remaining profile', () => {
    expect(removeProfile([{ id: 'a' }], 'a').map(p => p.id)).toEqual(['a']);
  });

  it('starts every new profile on the first avatar of the shared slider and offers 10 avatars (1 normal + 9 characters)', () => {
    expect(PROFILE_AVATARS).toHaveLength(10);
    expect(PROFILE_AVATARS[0]).toBe('normal');
    expect(PROFILE_AVATARS).toContain('iron-hero');
    expect(createProfileDraft([], 'x').avatar).toBe(PROFILE_AVATARS[0]);
    expect(createProfileDraft([1, 2, 3], 'y').avatar).toBe(PROFILE_AVATARS[0]);
  });
});

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
  computeMonthlyExpiryIso,
  type AccountSubscription,
} from '@/nova/subscription';

export const getAccountSubscription = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      phone: z.string().max(24).optional(),
      token: z.string().max(200).optional(),
      hasDefaultPreviewPlan: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }): Promise<AccountSubscription> => {
    const now = new Date();
    const fetchedAt = now.toISOString();
    const rawPhone = String(data.phone ?? '').trim();
    const digits = rawPhone.replace(/\D/g, '');
    const local10 = digits.length >= 10 ? digits.slice(-10) : digits;

    try {
      const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
      let userRow: {
        subscription_status: string;
        created_at: string;
      } | null = null;

      if (data.token) {
        const { data: sess } = await db
          .from('sessions')
          .select('user_id, expires_at')
          .eq('token', data.token)
          .maybeSingle();
        if (sess && new Date(sess.expires_at).getTime() > now.getTime()) {
          const { data: u } = await db
            .from('users')
            .select('subscription_status, created_at')
            .eq('id', sess.user_id)
            .maybeSingle();
          if (u) userRow = u;
        }
      }

      if (!userRow && local10.length === 10) {
        const candidates = Array.from(
          new Set([rawPhone, local10, `+91${local10}`, `91${local10}`].filter(Boolean)),
        );
        const { data: u } = await db
          .from('users')
          .select('subscription_status, created_at')
          .in('phone', candidates)
          .limit(1)
          .maybeSingle();
        if (u) userRow = u;
      }

      if (userRow) {
        const status = userRow.subscription_status.toLowerCase();
        if (status === 'premium') {
          return {
            planName: 'NOVA Premium',
            tier: 'premium',
            paid: true,
            actionLabel: null,
            fetchedAt,
            expiresAt: computeMonthlyExpiryIso(userRow.created_at, now),
          };
        }
        if (status === 'active') {
          return {
            planName: 'Mobile 1 Month',
            tier: 'normal',
            paid: true,
            actionLabel: 'Upgrade',
            fetchedAt,
            expiresAt: computeMonthlyExpiryIso(userRow.created_at, now),
          };
        }
        return {
          planName: 'No Active Plan',
          tier: 'none',
          paid: false,
          actionLabel: 'Subscribe',
          fetchedAt,
          expiresAt: null,
        };
      }
    } catch {
      /* fallback when server DB is not configured */
    }

    if (data.hasDefaultPreviewPlan) {
      return {
        planName: 'Mobile 1 Month',
        tier: 'normal',
        paid: true,
        actionLabel: 'Upgrade',
        fetchedAt,
        expiresAt: computeMonthlyExpiryIso(null, now),
      };
    }

    return {
      planName: 'No Active Plan',
      tier: 'none',
      paid: false,
      actionLabel: 'Subscribe',
      fetchedAt,
      expiresAt: null,
    };
  });

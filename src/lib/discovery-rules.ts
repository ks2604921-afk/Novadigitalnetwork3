import { z } from 'zod';

export const httpsUrl = z.string().url().max(2000).refine(value => new URL(value).protocol === 'https:', 'Use an HTTPS URL');
export const discoverySchema = z.object({
  id: z.string().uuid().optional(), kind: z.enum(['clip', 'upcoming']),
  title: z.string().trim().min(1).max(200), description: z.string().trim().max(2000),
  image_url: httpsUrl, video_url: httpsUrl, release_at: z.string().datetime().nullable(), is_published: z.boolean(),
});
export type DiscoveryItem = Omit<z.infer<typeof discoverySchema>, 'id'> & { id: string };
export const announcementSchema = z.object({ title: z.string().trim().min(1).max(100), body: z.string().trim().min(1).max(500), path: z.string().max(300).refine(path => path.startsWith('/') && !path.startsWith('//') && !path.includes('\\'), 'Use an app path'), push: z.boolean() });
export const subscriptionSchema = z.object({ endpoint: httpsUrl.refine(value => {
  const url = new URL(value);
  return !url.username && !url.password && (!url.port || url.port === '443') && (url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com' || url.hostname === 'web.push.apple.com' || url.hostname.endsWith('.notify.windows.com'));
}, 'Unsupported push service'), expirationTime: z.number().nullable(), keys: z.object({ p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}$/), auth: z.string().regex(/^[A-Za-z0-9_-]{22}$/) }) });
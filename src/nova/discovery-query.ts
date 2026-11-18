import { queryOptions, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DiscoveryItem } from '@/lib/discovery-rules';
import neon from '@/assets/neon-dreams-poster.webp';
import crimson from '@/assets/crimson-veil-poster.webp';
import shadow from '@/assets/shadow-protocol-poster.webp';
import barcode from '@/assets/barcode-poster.webp';
import sample from '@/assets/nova_sample_video.mp4.asset.json';

export const previewDiscovery: DiscoveryItem[] = [
  ...[{ title: 'Neon Dreams', image: neon, about: 'A shared dream. An impossible connection.' }, { title: 'Crimson Veil', image: crimson, about: 'Every secret leaves a trace.' }, { title: 'Shadow Protocol', image: shadow, about: 'One mission. No way back.' }, { title: 'Barcode', image: barcode, about: 'The code changes everything.' }].flatMap((item, i) => (['clip', 'upcoming'] as const).map(kind => ({ id: `preview-${kind}-${i}`, kind, title: item.title, description: item.about, image_url: item.image, video_url: sample.url, release_at: null, is_published: true }))),
];
export const discoveryQuery = queryOptions({ queryKey: ['nova', 'discovery'], queryFn: async () => {
  const { data, error } = await supabase.from('discovery_items').select('*').eq('is_published', true).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}, refetchInterval: 30000 });
export function useDiscovery(kind: DiscoveryItem['kind']) {
  const query = useQuery(discoveryQuery);
  const published = query.data?.filter(item => item.kind === kind) ?? [];
  return { ...query, items: published.length ? published : previewDiscovery.filter(item => item.kind === kind), preview: !published.length };
}
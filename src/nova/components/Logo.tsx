import NovaMark from '@/nova/components/NovaMark';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const text = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl', xl: 'text-5xl' }[size];
  const mark = { sm: 'h-[0.95rem]', md: 'h-[1.15rem]', lg: 'h-[1.7rem]', xl: 'h-[2.15rem]' }[size];
  return (
    <div className="flex select-none items-center" aria-label="NOVA">
      <NovaMark className={`${mark} w-auto drop-shadow-[0_0_8px_rgba(124,58,237,0.45)]`} />
      <span className={`ml-[0.08em] font-extrabold leading-none tracking-tight text-white ${text}`} aria-hidden>
        OVA
      </span>
    </div>
  );
}

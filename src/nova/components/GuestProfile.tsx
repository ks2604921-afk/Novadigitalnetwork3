import Logo from '@/nova/components/Logo';

export default function GuestProfile({ onLogin, onSettings }: { onLogin: () => void; onSettings: () => void }) {
  return (
    <div className="min-h-screen bg-nova-black pb-28 pt-24 text-nova-text lg:pb-12">
      <div className="mx-auto flex max-w-md flex-col px-6">
        <div className="mt-20 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-10 text-2xl font-bold sm:text-3xl">Log in to NOVA</h1>
          <p className="mt-3 text-sm text-nova-muted">Discover a world of fun, fantasy &amp; imagination.</p>
          <button
            onClick={onLogin}
            className="nova-pill mt-10 w-full rounded-full bg-violet-600 py-4 text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.7)] active:scale-[0.98]"
          >
            Login
          </button>
          <button onClick={onSettings} className="mt-6 text-sm text-nova-muted">
            Having trouble in login? <span className="font-semibold text-nova-text">Help</span>
          </button>
        </div>
      </div>
    </div>
  );
}

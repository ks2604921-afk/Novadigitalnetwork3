import { Button } from '@/components/ui/button';
import Logo from '@/nova/components/Logo';

type Props = {
  onLogin: () => void;
  onSignUp: () => void;
};

export default function Welcome({ onLogin, onSignUp }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-nova-black px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/assets/aistudio/image_fe2e737_928d888c.jpg"
          alt=""
          className="nova-poster-drift h-full w-full object-cover opacity-70 blur-[4px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nova-black/90 via-nova-black/55 to-nova-black/40" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(229,9,20,0.4),transparent_70%)]" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.3),transparent_70%)]" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <Logo size="lg" />
        <h1 className="mt-6 max-w-md text-3xl font-bold leading-tight sm:text-4xl">
          Unlimited movies, TV shows and more.
        </h1>
        <p className="mt-3 max-w-md text-sm text-nova-muted sm:text-base">
          Create an account with your mobile number and unlock NOVA with a 4-digit PIN.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Button
            onClick={onSignUp}
            className="h-12 w-full bg-nova-red text-base font-semibold hover:bg-nova-red/90"
          >
            Get started
          </Button>
          <Button
            onClick={onLogin}
            variant="outline"
            className="h-12 w-full border-nova-line bg-transparent text-base font-semibold text-white hover:bg-nova-card"
          >
            I already have an account
          </Button>
        </div>
      </div>
      <footer className="relative z-10 mt-12 text-center text-xs text-nova-muted">
        Demo build — OTP is shown on screen since no SMS provider is configured.
      </footer>
    </div>
  );
}

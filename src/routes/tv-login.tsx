import { createFileRoute, useNavigate } from "@tanstack/react-router";
import TvLogin from "@/nova/components/TvLogin";
import { saveCurrentPhone } from "@/nova/user-account";

export const Route = createFileRoute("/tv-login")({
  head: () => ({
    meta: [
      { title: "NOVA TV — Personal Login" },
      { name: "description", content: "Sign in to NOVA on your TV screen." },
    ],
  }),
  component: TvLoginPage,
});

function TvLoginPage() {
  const navigate = useNavigate();
  return (
    <TvLogin
      onDone={(phone) => {
        try {
          localStorage.setItem("nova-sample-login", "1");
        } catch {
          /* storage unavailable */
        }
        saveCurrentPhone(phone ?? "");
        navigate({ to: "/", search: { tv: "1" }, replace: true });
      }}
    />
  );
}

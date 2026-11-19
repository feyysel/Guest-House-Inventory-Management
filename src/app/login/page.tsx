import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { getSession } from "@/lib/session";
import { getGuesthouseSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [session, settings] = await Promise.all([
    getSession(),
    getGuesthouseSettings(),
  ]);

  if (session) {
    redirect("/");
  }

  return <LoginForm guesthouseName={settings.guesthouseName} />;
}

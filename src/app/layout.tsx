import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/app-shell";
import BootstrapProvider from "@/components/bootstrap-provider";
import { getGuesthouseSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import StoreProvider from "@/store/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeBootScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGuesthouseSettings();

  return {
    title: `${settings.guesthouseName} | Guesthouse Management`,
    description: `Manage rooms, reservations, guests, and payments at ${settings.guesthouseName}.`,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, settings] = await Promise.all([
    getSession(),
    getGuesthouseSettings(),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="light"
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <StoreProvider user={user} guesthouseName={settings.guesthouseName}>
          <BootstrapProvider>
            <AppShell>{children}</AppShell>
          </BootstrapProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

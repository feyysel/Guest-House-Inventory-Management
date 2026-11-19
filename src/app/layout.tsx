import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import AppShell from "@/components/app-shell";
import BootstrapProvider from "@/components/bootstrap-provider";
import { getGuesthouseSettings } from "@/lib/settings";
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGuesthouseSettings();

  return {
    title: `${settings.guesthouseName} | Guesthouse Management`,
    description: `Manage rooms, reservations, guests, and payments at ${settings.guesthouseName}.`,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-boot" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("havenstay-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t;}catch(e){}})();`}
        </Script>
        <StoreProvider>
          <BootstrapProvider>
            <AppShell>{children}</AppShell>
          </BootstrapProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

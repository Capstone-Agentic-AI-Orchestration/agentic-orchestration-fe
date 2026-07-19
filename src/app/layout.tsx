import type { Metadata } from "next";
import "@/shared/styles/globals.css";
import { AuthProvider } from "@/shared/auth/auth-provider";
import { ToastProvider } from "@/shared/components/ui/toast-provider";

export const metadata: Metadata = {
  title: "DevFlow Console",
  description: "Internal DevFlow orchestration console. Authorized staff only.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "@/shared/styles/globals.css";
import { AuthProvider } from "@/shared/auth/auth-provider";
import { ToastProvider } from "@/shared/components/ui/toast-provider";

export const metadata: Metadata = {
  title: "Alphaexplora — Enterprise IT Solutions for Philippine MSMEs",
  description:
    "Alphaexplora is a Philippine boutique IT consultancy delivering enterprise software for MSMEs and mid-market companies.",
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

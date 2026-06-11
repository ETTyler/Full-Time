import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { SubmitButton } from "@/components/SubmitButton";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Full Time",
  description: "Create a league, invite your friends, and run a FIFA World Cup sweepstake draw.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>"
      />
      <body className={`${inter.variable} min-h-screen antialiased`}>
        <header className="site-header">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight"
            >
              ⚽ Full Time <span className="text-accent">’26</span>
            </Link>
            {session?.user ? (
              <form
                className="flex items-center gap-3"
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <span className="text-sm text-muted">
                  {session.user.username ?? session.user.name}
                </span>
                <SubmitButton
                  pendingLabel="Signing out…"
                  className="btn-ghost px-3 py-1.5"
                >
                  Sign out
                </SubmitButton>
              </form>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google");
                }}
              >
                <SubmitButton
                  pendingLabel="Signing in…"
                  className="btn-primary px-3 py-1.5"
                >
                  Sign in
                </SubmitButton>
              </form>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

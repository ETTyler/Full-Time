import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Full Time",
  description: "Draw your teams. Watch them run. Win the bragging rights.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
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
                <button className="btn-ghost px-3 py-1.5">Sign out</button>
              </form>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google");
                }}
              >
                <button className="btn-primary px-3 py-1.5">Sign in</button>
              </form>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

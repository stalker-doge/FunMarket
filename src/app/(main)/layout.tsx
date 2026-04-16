import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { NavBar } from "@/components/nav-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { plain } from "@/lib/db";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const safeUser = plain(user);

  return (
    <>
      <NavBar
        username={safeUser.username}
        displayName={safeUser.displayName}
        email={safeUser.email}
        balance={safeUser.balance}
        avatarUrl={safeUser.avatarUrl}
      />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 pb-20 sm:pb-6">{children}</main>
      <MobileBottomNav displayName={safeUser.displayName} />
    </>
  );
}

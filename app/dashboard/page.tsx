import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  
  // If not logged in, redirect to login page
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }
  
  return <DashboardClient session={session} />;
}
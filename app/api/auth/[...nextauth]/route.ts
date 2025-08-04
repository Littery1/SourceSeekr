// app/api/auth/[...nextauth]/route.ts

export { handlers as GET, handlers as POST } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

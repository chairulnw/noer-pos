import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    sid?: string;
  }
  interface Session {
    user: User & {
      id: string;
      role: Role;
    };
    sid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    sid?: string;
  }
}

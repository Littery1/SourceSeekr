// Add custom types for Next-Auth
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    githubUsername?: string;
    githubAccessToken?: string;
    githubTokenType?: string;
    githubTokenScopes?: string[];
  }

  interface Session {
    user?: {
      id?: string;
      githubUsername?: string;
      githubAccessToken?: string;
      githubTokenType?: string;
      githubTokenScopes?: string[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/types" {
  interface Session {
    user?: {
      id?: string;
      githubUsername?: string;
      githubAccessToken?: string;
      githubTokenType?: string;
      githubTokenScopes?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    githubUsername?: string;
    githubAccessToken?: string;
    githubTokenType?: string;
    githubTokenScopes?: string[];
  }
}
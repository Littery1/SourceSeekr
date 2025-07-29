/**
 * This file is not needed for the current auth flow.
 * Session data, including access tokens, should be handled on the server.
 * Client-side components should call API routes to perform actions or get status.
 *
 * Leaving this file empty or deleting it is recommended to avoid confusion.
 * If you need client-side auth helpers in the future, they can be added here.
 */

// For now, we can keep the clearAuthState function if you use it somewhere else,
// but the getGitHubToken is not being used correctly.
export function clearAuthState(redirectUrl?: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined") {
      // Clear any auth-related items from localStorage
      localStorage.removeItem("sourceseekr-saved");
      localStorage.removeItem("sourceseekr-preferences");
      localStorage.removeItem("chatMessages");

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
    resolve();
  });
}

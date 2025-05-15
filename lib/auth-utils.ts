
/**
 * Clear authentication state from localStorage and cookies
 * @param redirectUrl Optional URL to redirect to after clearing state
 */
export function clearAuthState(redirectUrl?: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined") {
      // Clear any auth-related items from localStorage
      localStorage.removeItem("github-auth");
      localStorage.removeItem("sourceseekr-auth");
      localStorage.removeItem("sourceseekr-token");
      
      // Clear NextAuth.js session cookies
      // Using document.cookie to clear all auth-related cookies
      const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.session-token',
        'next-auth.csrf-token',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.callback-url',
        '__Host-next-auth.callback-url'
      ];
      
      // Clear each cookie by setting it to expired
      cookieNames.forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        // Also try with secure, httpOnly, and SameSite options
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}; secure; SameSite=Lax`;
      });
      
      // If a redirect URL is provided and we're in the browser
      if (redirectUrl) {
        // Add timestamp to prevent caching
        const separator = redirectUrl.includes('?') ? '&' : '?';
        const urlWithTimestamp = `${redirectUrl}${separator}t=${Date.now()}`;
        window.location.href = urlWithTimestamp;
      }
    }
    
    // Resolve the promise after a short delay to allow for other operations
    setTimeout(() => {
      resolve();
    }, 100);
  });
}

/**
 * Get the GitHub token from the session
 * @returns The GitHub token or null if not authenticated
 */
export function getGitHubToken(): string | null {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sourceseekr-token");
    return token;
  }
  return null;
}

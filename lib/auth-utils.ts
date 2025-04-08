
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
      
      // You might want to add other auth-related items to clear
      
      // If a redirect URL is provided and we're in the browser
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
    
    // Resolve the promise after a short delay to allow for other operations
    setTimeout(() => {
      resolve();
    }, 100);
  });
}

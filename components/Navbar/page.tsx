"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { ThemeToggle } from "../theme-toggle";
import { clearAuthState } from "@/lib/auth-utils";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleGitHubLogin = async () => {
    try {
      setSubmitting(true);
      // Sign in with GitHub
      await signIn("github", {
        callbackUrl: "/dashboard",
        prompt: "select_account" // Force GitHub to show account selection
      });
      // The redirect is handled by GitHub OAuth
    } catch (error: any) {
      console.error("GitHub login error:", error);
      toast.error(error.message || "Login failed");
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      toast.loading("Signing out...");
      
      // First clear local auth state
      await clearAuthState('/');
      
      // Use direct signout with callback to root page
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (error: any) {
      toast.dismiss();
      console.error("Logout error:", error);
      toast.error(error.message || "Logout failed");
      
      // Fallback to redirect to home page
      window.location.href = '/';
    }
  };

  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/about", label: "About" },
    { href: "/chat", label: "Chat" },
  ];

  if (session) {
    navLinks.push({ href: "/dashboard", label: "Dashboard" });
    navLinks.push({ href: "/saved", label: "Saved" });
    // Profile moved to dropdown menu
  }

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center gap-2 font-bold text-foreground text-xl transition-transform hover:scale-105"
              aria-label="SourceSeekr Home"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#6366f1]">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-primary font-semibold">SourceSeekr</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="ml-4 flex items-center">
              <ThemeToggle />
            </div>

            {session ? (
              <div className="flex items-center ml-4">
                <div className="relative group">
                  <button 
                    className="flex items-center focus:outline-none"
                    aria-label="Open user menu"
                  >
                    <Image
                      src={session.user?.image || "/images/default.png"}
                      alt="User Profile"
                      width={36}
                      height={36}
                      className="rounded-full border-2 border-primary/20 transition-all duration-200 group-hover:border-primary"
                    />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      Profile
                    </Link>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center ml-4">
                <button 
                  onClick={() => router.push('/login')}
                  disabled={submitting}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Image 
                    src="/images/github.svg" 
                    alt="GitHub" 
                    width={20} 
                    height={20} 
                  />
                  Sign in with GitHub
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              type="button"
              className="ml-4 inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block animate-fade-in' : 'hidden'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md ${
                pathname === link.href ? 'bg-muted text-primary font-medium' : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          
          {session ? (
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center px-3">
                <Image
                  src={session.user?.image || "/images/default.png"}
                  alt="User Profile"
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-left px-3 py-2 mt-2 text-sm text-foreground hover:bg-muted rounded-md"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 mt-2 text-sm text-foreground hover:bg-muted rounded-md"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-border pt-4 mt-4 flex flex-col space-y-2 px-3">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push('/login');
                }}
                disabled={submitting}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Image 
                  src="/images/github.svg" 
                  alt="GitHub" 
                  width={20} 
                  height={20} 
                />
                Sign in with GitHub
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
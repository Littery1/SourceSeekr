import Link from "next/link";

interface RateLimitErrorProps {
  message?: string;
  showButtons?: boolean;
}

export default function RateLimitError({ 
  message = "GitHub API rate limit exceeded. Please try again later or check other pages that don't require as many API calls.",
  showButtons = true
}: RateLimitErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-destructive">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">GitHub API Rate Limit Exceeded</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">{message}</p>
      {showButtons && (
        <div className="flex gap-4">
          <Link href="/explore" className="btn btn-primary">
            Explore Repositories
          </Link>
          <Link href="/profile" className="btn btn-outline">
            View Profile
          </Link>
        </div>
      )}
    </div>
  );
}
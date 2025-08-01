import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";

export default async function AboutPage() {
  const session = await auth();
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">
          About SourceSeekr
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Discover GitHub repositories tailored to your programming interests,
          skill level, and goals. SourceSeekr uses Deepseek AI to match you with
          repositories that will help you learn, contribute, and grow as a
          developer.
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">
          How SourceSeekr Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect with GitHub</h3>
            <p className="text-muted-foreground">
              Sign in with your GitHub account to unlock personalized
              recommendations. We analyze your starred repositories,
              contributions, and interests to understand what coding projects
              matter to you.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-muted-foreground">
              Our Deepseek AI model examines millions of GitHub repositories,
              analyzing code patterns, documentation quality, community
              activity, and project health to find the perfect matches.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Discover & Learn</h3>
            <p className="text-muted-foreground">
              Receive tailored recommendations based on your skill level,
              preferred languages, and learning goals. Save repositories you
              like and track your progress as you grow.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Key Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full h-min">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Deepseek AI Recommendations
              </h3>
              <p className="text-muted-foreground">
                Powered by state-of-the-art AI that understands code
                relationships and project quality to deliver accurate,
                personalized repository recommendations.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full h-min">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">GitHub Integration</h3>
              <p className="text-muted-foreground">
                Seamless authentication with GitHub to access personalized
                recommendations. Browse comprehensive metrics for each
                repository to make informed decisions.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full h-min">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Powerful Filtering</h3>
              <p className="text-muted-foreground">
                Filter repositories by programming language, project size,
                activity level, and beginner-friendliness to find exactly what
                you&apos;re looking for.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full h-min">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Personalized Collections
              </h3>
              <p className="text-muted-foreground">
                Save repositories you&apos;re interested in, add personal notes,
                and organize your learning journey. Track your progress across
                different projects and skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How AI Works */}
      <section className="mb-16 bg-card border border-border rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">
          The Technology Behind SourceSeekr
        </h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Deepseek AI Analysis</h3>
          <p className="text-muted-foreground mb-4">
            SourceSeekr leverages the powerful Deepseek AI model to analyze
            GitHub repositories and understand what makes a project valuable for
            different types of developers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="border border-border rounded-lg p-4">
              <h4 className="font-medium mb-2">Code Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Our AI examines code quality, structure, and patterns to assess
                a repository&apos;s technical sophistication and reliability.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-medium mb-2">Community Metrics</h4>
              <p className="text-sm text-muted-foreground">
                We evaluate contributor activity, issue responsiveness, and
                community engagement to find welcoming projects.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-medium mb-2">Documentation Quality</h4>
              <p className="text-sm text-muted-foreground">
                The AI assesses README files, wiki pages, and inline
                documentation to find projects that are accessible to new
                contributors.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Personalization Engine</h3>
          <p className="text-muted-foreground mb-4">
            The more you use SourceSeekr, the better it gets at recommending
            repositories that match your specific interests and skill level.
          </p>

          <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
            <li>
              Your GitHub stars and contributions help us understand your
              technical interests
            </li>
            <li>
              Repositories you browse and save on SourceSeekr refine your
              preference profile
            </li>
            <li>
              Our AI continuously learns from user feedback to improve
              recommendations
            </li>
            <li>
              We balance showing popular repositories with discovering hidden
              gems that match your specific needs
            </li>
          </ul>
        </div>
      </section>

      {/* Technologies */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Built With</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {[
            {
              name: "Next.js",
              logo: "https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png",
            },
            {
              name: "TypeScript",
              logo: "https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/typescript/typescript.png",
            },
            { name: "Tailwind CSS", logo: "/images/tailwind-logo.svg" },
            {
              name: "Prisma",
              logo: "https://www.prisma.io/images/favicon-32x32.png",
            },
            {
              name: "NextAuth.js",
              logo: "https://next-auth.js.org/img/logo/logo-sm.png",
            },
            {
              name: "Deepseek AI",
              logo: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
            },
          ].map((tech, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 flex flex-col items-center"
            >
              <div className="h-12 w-12 relative mb-2">
                <Image
                  src={tech.logo}
                  alt={tech.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-xl p-10 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Find Your Perfect Repository?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Sign in with your GitHub account to get personalized repository
          recommendations powered by Deepseek AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {session ? (
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary flex items-center gap-2"
            >
              <Image
                src="/images/github.svg"
                alt="GitHub"
                width={20}
                height={20}
              />
              Sign in with GitHub
            </Link>
          )}
          <Link href="/explore" className="btn btn-outline">
            Explore Repositories
          </Link>
        </div>
      </section>
    </div>
  );
}
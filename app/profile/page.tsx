import { auth } from "@/auth";
import Header from "@/components/header";
import Image from "next/image";
import { Octokit } from "@octokit/core";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN, // Use an environment variable for security
  });

  let githubData = null;
  let repoData = null;

  try {
    // Fetch authenticated GitHub user data
    const response = await octokit.request("GET /user");
    githubData = response.data;

    // Fetch repository information
    const repoResponse = await octokit.request("GET /repos/{owner}/{repo}", {
      owner: "mozilla-mobile", // Replace with the owner of the repo
      repo: "firefox-ios", // Replace with the repo name
    });
    repoData = repoResponse.data;
  } catch (error) {
    console.error("Error fetching GitHub data:", (error as any).message);
  }

  return (
    <>
      <Header />
      <section className="bg-ct-blue-600 min-h-screen pt-20">
        <div className="max-w-4xl mx-auto bg-ct-dark-100 rounded-md h-auto flex flex-col justify-center items-center p-6">
          <div>
            <p className="mb-3 text-5xl text-center font-semibold">
              Profile Page
            </p>
            <div className="flex items-center gap-8">
              <div>
                <Image
                  src={user?.image ? user.image : "/images/default.png"}
                  alt={`profile photo of ${user?.name}`}
                  width={90}
                  height={90}
                />
              </div>
              <div className="mt-8">
                <p className="mb-3">ID: {user?.id}</p>
                <p className="mb-3">Name: {user?.name}</p>
                <p className="mb-3">Email: {user?.email}</p>

                {/* GitHub User Data */}
                {githubData && (
                  <>
                    <p className="mb-3">GitHub Username: {githubData.login}</p>
                    <p className="mb-3">GitHub Bio: {githubData.bio}</p>
                    <p className="mb-3">
                      Public Repos: {githubData.public_repos}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Repository Information */}
          {repoData && (
            <div className="mt-10 bg-ct-dark-50 p-6 rounded-md w-full">
              <h2 className="text-3xl font-bold mb-4">
                Repository: {repoData.name}
              </h2>
              <p className="mb-2">
                <strong>Description:</strong> {repoData.description}
              </p>
              <p className="mb-2">
                <strong>Owner:</strong> {repoData.owner.login}
              </p>
              <p className="mb-2">
                <strong>Stars:</strong> {repoData.stargazers_count}
              </p>
              <p className="mb-2">
                <strong>Forks:</strong> {repoData.forks_count}
              </p>
              <p className="mb-2">
                <strong>Open Issues:</strong> {repoData.open_issues_count}
              </p>
              <p className="mb-2">
                <strong>Default Branch:</strong> {repoData.default_branch}
              </p>
              <a
                href={repoData.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ct-blue-300 underline"
              >
                View on GitHub
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

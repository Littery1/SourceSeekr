import { auth } from "@/auth";
import Header from "@/components/header";
import Image from "next/image";
import { Octokit } from "@octokit/core";

interface GitHubUser {
  name: string | null;
  login: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

interface Repository {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

async function fetchGitHubData() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // Fetch authenticated GitHub user data
  const { data: githubData } = await octokit.request<GitHubUser>({
    method: "GET",
    url: "/user",
  });

  // Fetch 10 random open-source repositories
  const { data: randomRepos } = await octokit.request<string>(
    "GET /repositories",
    { per_page: 10 }
  );

  return { githubData, randomRepos };
}

export default async function ProfilePage() {
  const session = await auth(); // Update this based on your auth method
  const user = session?.user;

  let githubData: GitHubUser | null = null;
  let randomRepos: Repository[] = [];
  let modelPrediction: any = null;

  try {
    const data = await fetchGitHubData();
    githubData = data.githubData;
    randomRepos = data.randomRepos;

    // Prepare the combined text for the AI model
    const userProfileText = `
        User's GitHub Profile:
        Name: ${githubData?.name || "Unknown"}
        Username: ${githubData?.login || "Unknown"}
        Bio: ${githubData?.bio || "No bio"}
        Public Repos: ${githubData?.public_repos || 0}
        Followers: ${githubData?.followers || 0}
      `;

    const inputPayload = {
      inputs: `
      Recommend the top 3 repositories that align best with the user's interests based on the following:

      User's GitHub Profile:
      Name: ${githubData?.name || "Unknown"}
      Username: ${githubData?.login || "Unknown"}
      Bio: ${githubData?.bio || "No bio"}
      Public Repos: ${githubData?.public_repos || 0}
      Followers: ${githubData?.followers || 0}

      Repositories:
      ${randomRepos
        .map(
          (repo) =>
            `Name: ${repo.name}, Description: ${repo.description || "N/A"}`
        )
        .join("; ")}
    `.trim(),
    };
  } catch (error) {
    console.error("Error fetching data:", (error as Error).message);
  }

  return (
    <>
      <Header />
      <section className="bg-ct-blue-600 min-h-screen pt-20">
        <div className="max-w-4xl mx-auto bg-ct-dark-100 rounded-md h-auto flex flex-col justify-center items-center p-6">
          <p className="mb-3 text-5xl text-center font-semibold">
            Profile Page
          </p>
          <div>
            <Image
              src={user?.image ? user.image : "/images/default.png"}
              alt={`Profile photo of ${user?.name}`}
              width={90}
              height={90}
            />
            <p>ID: {user?.id}</p>
            <p>Name: {user?.name}</p>
            <p>Email: {user?.email}</p>
            {githubData ? (
              <p>GitHub Username: {githubData.login}</p>
            ) : (
              <p>No GitHub data available.</p>
            )}
            {modelPrediction && (
              <div>
                <p className="mt-5">AI Recommendations: </p>
                <ul className="mt-2 p-2 bg-gray-200 rounded max-w-full overflow-auto">
                  <li>
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(modelPrediction, null, 2)}
                    </pre>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

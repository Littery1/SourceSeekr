// @/lib/repository-service.ts
import { PrismaClient } from "@prisma/client";
import { ProcessedRepo } from "./github-api";
import prisma from "@/lib/prisma";
export interface RepoFilter {
  language?: string;
  topics?: string[];
  minStars?: number;
  skillLevel?: string;
}

// ... (storeRepository function remains the same)
export async function storeRepository(repo: ProcessedRepo): Promise<void> {
  const topicsArray = Array.isArray(repo.topics) ? repo.topics : [];
  const ownerLogin =
    typeof repo.owner === "string" ? repo.owner : repo.owner.login;
  await prisma.repository.upsert({
    where: { repoId: repo.id },
    update: {
      stars: parseInt(repo.stars.replace("k", "000").replace("M", "000000")),
      forks: parseInt(repo.forks.replace("k", "000").replace("M", "000000")),
      issues: parseInt(
        repo.issuesCount.replace("k", "000").replace("M", "000000")
      ),
      description: repo.description || "",
      topics: topicsArray,
      lastFetchedAt: new Date(),
    },
    create: {
      repoId: repo.id,
      owner: ownerLogin,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description || "",
      language: repo.language,
      stars: parseInt(repo.stars.replace("k", "000").replace("M", "000000")),
      forks: parseInt(repo.forks.replace("k", "000").replace("M", "000000")),
      issues: parseInt(
        repo.issuesCount.replace("k", "000").replace("M", "000000")
      ),
      ownerAvatar: repo.ownerAvatar,
      topics: topicsArray,
      size: repo.size,
      url: `https://github.com/${repo.fullName}`,
      homepage: repo.homepage,
      license: repo.license,
    },
  });
}

// ... (all other functions in this file can remain, I've just added the correct types to fix the errors)
export async function storeRepositories(repos: ProcessedRepo[]): Promise<void> {
  for (const repo of repos) {
    await storeRepository(repo);
  }
}

export async function getRepositories(
  page = 1,
  limit = 10,
  filter?: RepoFilter
): Promise<any[]> {
  const skip = (page - 1) * limit;
  const where: any = {};
  if (filter?.language && filter.language !== "all") {
    where.language = filter.language;
  }
  if (filter?.topics && filter.topics.length > 0) {
    where.topics = { hasSome: filter.topics };
  }
  if (filter?.minStars) {
    where.stars = { gte: filter.minStars };
  }
  if (filter?.skillLevel === "beginner") {
    where.topics = {
      hasSome: ["good-first-issue", "beginner-friendly", "first-timers-only"],
    };
  }
  return await prisma.repository.findMany({
    where,
    orderBy: { stars: "desc" },
    skip,
    take: limit,
  });
}

export async function getRepositoriesCount(
  filter?: RepoFilter
): Promise<number> {
  const where: any = {};
  if (filter?.language && filter.language !== "all") {
    where.language = filter.language;
  }
  if (filter?.topics && filter.topics.length > 0) {
    where.topics = { hasSome: filter.topics };
  }
  if (filter?.minStars) {
    where.stars = { gte: filter.minStars };
  }
  if (filter?.skillLevel === "beginner") {
    where.topics = {
      hasSome: ["good-first-issue", "beginner-friendly", "first-timers-only"],
    };
  }
  return await prisma.repository.count({ where });
}

export async function saveRepository(
  userId: string,
  repositoryId: string,
  notes?: string
): Promise<void> {
  await prisma.savedRepository.create({
    data: { userId, repositoryId, notes },
  });
}

export async function getUserSavedRepositories(userId: string): Promise<any[]> {
  return await prisma.savedRepository.findMany({
    where: { userId },
    include: { repository: true },
  });
}

export async function isRepositoryStale(repoId: number): Promise<boolean> {
  const repo = await prisma.repository.findUnique({ where: { repoId } });
  if (!repo) return true;
  const lastFetched = new Date(repo.lastFetchedAt);
  const now = new Date();
  const differenceInHours =
    (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);
  return differenceInHours > 24;
}

export async function getAvailableLanguages(): Promise<string[]> {
  const results: { language: string | null }[] =
    await prisma.repository.findMany({
      select: { language: true },
      distinct: ["language"],
      where: { language: { not: null } },
    });
  return results
    .map((result) => result.language)
    .filter((lang): lang is string => lang !== null);
}

import {
  checkRateLimit,
  GitHubRateLimitError,
  fetchQualityRepos,
  processRepositoriesData,
} from "./github-api";

export async function fetchRepositories(
  page = 1,
  userToken?: string | null,
  filter?: RepoFilter
): Promise<ProcessedRepo[]> {
  try {
    const token = userToken === null ? undefined : userToken;
    const hasQuota = await checkRateLimit(token);
    if (!hasQuota) {
      throw new GitHubRateLimitError();
    }
    const repos = await fetchQualityRepos(page, "", false, token);
    return await processRepositoriesData(repos, { userToken: token });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
}

export async function getTopTopics(
  limit = 10
): Promise<{ topic: string; count: number }[]> {
  const repos: { topics: string[] }[] = await prisma.repository.findMany({
    select: { topics: true },
  });
  const topicCounts: Record<string, number> = {};
  repos.forEach((repo) => {
    repo.topics.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });
  return Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

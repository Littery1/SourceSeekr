// @/lib/repository-service.ts
import { PrismaClient } from '@prisma/client';
import { ProcessedRepo } from './github-api';

const prisma = new PrismaClient();

export interface RepoFilter {
  language?: string;
  topics?: string[];
  minStars?: number;
  skillLevel?: string;
}

/**
 * Store a repository in the database
 * If the repository already exists, update it
 */
export async function storeRepository(repo: ProcessedRepo): Promise<void> {
  const topicsArray = Array.isArray(repo.topics) ? repo.topics : [];
  
  await prisma.repository.upsert({
    where: {
      repoId: repo.id,
    },
    update: {
      stars: parseInt(repo.stars.replace('k', '000').replace('M', '000000')),
      forks: parseInt(repo.forks.replace('k', '000').replace('M', '000000')),
      issues: parseInt(repo.issuesCount.replace('k', '000').replace('M', '000000')),
      description: repo.description || "",
      topics: topicsArray,
      lastFetchedAt: new Date(),
    },
    create: {
      repoId: repo.id,
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description || "",
      language: repo.language,
      stars: parseInt(repo.stars.replace('k', '000').replace('M', '000000')),
      forks: parseInt(repo.forks.replace('k', '000').replace('M', '000000')),
      issues: parseInt(repo.issuesCount.replace('k', '000').replace('M', '000000')),
      ownerAvatar: repo.ownerAvatar,
      topics: topicsArray,
      size: repo.size,
      url: `https://github.com/${repo.fullName}`,
      homepage: repo.homepage,
      license: repo.license,
    },
  });
}

/**
 * Store multiple repositories in the database
 */
export async function storeRepositories(repos: ProcessedRepo[]): Promise<void> {
  for (const repo of repos) {
    await storeRepository(repo);
  }
}

/**
 * Get repositories from the database with pagination
 */
export async function getRepositories(page = 1, limit = 10, filter?: RepoFilter): Promise<any[]> {
  const skip = (page - 1) * limit;
  
  // Build the where clause based on filters
  const where: any = {};
  
  if (filter?.language && filter.language !== 'all') {
    where.language = filter.language;
  }
  
  if (filter?.topics && filter.topics.length > 0) {
    where.topics = {
      hasSome: filter.topics,
    };
  }
  
  if (filter?.minStars) {
    where.stars = {
      gte: filter.minStars,
    };
  }
  
  // For beginner friendly repos
  if (filter?.skillLevel === 'beginner') {
    where.topics = {
      hasSome: ['good-first-issue', 'beginner-friendly', 'first-timers-only'],
    };
  }
  
  const repositories = await prisma.repository.findMany({
    where,
    orderBy: {
      stars: 'desc',
    },
    skip,
    take: limit,
  });
  
  return repositories;
}

/**
 * Get the total number of repositories matching a filter
 */
export async function getRepositoriesCount(filter?: RepoFilter): Promise<number> {
  // Build the where clause based on filters
  const where: any = {};
  
  if (filter?.language && filter.language !== 'all') {
    where.language = filter.language;
  }
  
  if (filter?.topics && filter.topics.length > 0) {
    where.topics = {
      hasSome: filter.topics,
    };
  }
  
  if (filter?.minStars) {
    where.stars = {
      gte: filter.minStars,
    };
  }
  
  // For beginner friendly repos
  if (filter?.skillLevel === 'beginner') {
    where.topics = {
      hasSome: ['good-first-issue', 'beginner-friendly', 'first-timers-only'],
    };
  }
  
  return await prisma.repository.count({
    where,
  });
}

/**
 * Save a repository for a user
 */
export async function saveRepository(userId: string, repositoryId: string, notes?: string): Promise<void> {
  await prisma.savedRepository.create({
    data: {
      userId,
      repositoryId,
      notes,
    },
  });
}

/**
 * Get a user's saved repositories
 */
export async function getUserSavedRepositories(userId: string): Promise<any[]> {
  return await prisma.savedRepository.findMany({
    where: {
      userId,
    },
    include: {
      repository: true,
    },
  });
}

/**
 * Check if a repository is stale (hasn't been updated in the last 24 hours)
 */
export async function isRepositoryStale(repoId: number): Promise<boolean> {
  const repo = await prisma.repository.findUnique({
    where: {
      repoId,
    },
  });
  
  if (!repo) return true;
  
  const lastFetched = new Date(repo.lastFetchedAt);
  const now = new Date();
  const differenceInHours = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);
  
  return differenceInHours > 24;
}

/**
 * Get all available languages in the database
 */
export async function getAvailableLanguages(): Promise<string[]> {
  const results = await prisma.repository.findMany({
    select: {
      language: true,
    },
    distinct: ['language'],
    where: {
      language: {
        not: null,
      },
    },
  });
  
  return results
    .map(result => result.language)
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
    // Convert null to undefined to match the expected parameter type
    const token = userToken === null ? undefined : userToken;

    // Check rate limit first
    const hasQuota = await checkRateLimit(token);
    if (!hasQuota) {
      throw new GitHubRateLimitError();
    }

    // Fetch repositories based on filter or default to quality repos
    const repos = await fetchQualityRepos(page, token);

    // Process repositories with the token to ensure auth is passed along
    const processedRepos = await processRepositoriesData(repos, {
      userToken: token,
    });

    return processedRepos;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
}
/**
 * Get top topics in the database
 */
export async function getTopTopics(limit = 10): Promise<{topic: string; count: number}[]> {
  const repos = await prisma.repository.findMany({
    select: {
      topics: true,
    },
  });
  
  const topicCounts: Record<string, number> = {};
  
  repos.forEach(repo => {
    repo.topics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });
  
  return Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
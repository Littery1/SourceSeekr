# DeepSeek Integration for SourceSeekr

This document outlines how SourceSeekr integrates with the DeepSeek AI for personalized repository recommendations.

## Overview

SourceSeekr uses DeepSeek's API to provide two key features:

1. **Repository Ranking**: DeepSeek ranks repositories based on user preferences and GitHub profile data
2. **Recommendation Explanations**: DeepSeek generates personalized explanations for why a repository is recommended

## Implementation

The integration is implemented in `lib/deepseek-service.ts` which provides:

- `getPersonalizedRepositories()`: Ranks repositories based on user profile and preferences
- `getRepositoryRecommendationReason()`: Generates an explanation for why a repository is recommended

## Configuration

You'll need to set up a DeepSeek API key in your `.env` file:

```
DEEPSEEK_API_KEY=your_api_key_here
```

DeepSeek API endpoint is configured to use:
- Base URL: https://api.deepseek.com/v1
- Model: deepseek-chat

## User Data Flow

1. When a user logs in with GitHub, we extract relevant profile information:
   - Username, bio, name
   - Popular repositories and their languages
   - Language usage statistics
   - Contribution patterns

2. User can set preferences in the profile page:
   - Interests (web development, machine learning, etc.)
   - Skill level (beginner, intermediate, expert)
   - What they're looking for (documentation, beginner-friendly, etc.)
   - Preferred programming languages

3. Both GitHub profile data and user preferences are passed to DeepSeek to personalize recommendations in the explore page.

## Explore Page Workflow

The explore page works as follows:

1. Initially loads 10 repositories from the database
2. If GitHub API rate limit is not reached, pulls 5 more new repositories
3. New repositories are stored in the database for future use
4. All repositories are sent to DeepSeek API to be ranked based on user profile and preferences
5. The "Show More" button loads 5 additional repositories at a time

## Error Handling

The DeepSeek integration includes fallback mechanisms:

- If DeepSeek API key is not set, uses simple sorting by stars
- If DeepSeek API call fails, falls back to basic recommendation algorithm
- All errors are logged but don't prevent the application from functioning
# Repository Recommendation System - Implementation Details

This document outlines the implementation of the repository recommendation system in SourceSeekr, focusing on the Explore page and Chat functionality.

## Explore Page Overview

The Explore page allows users to discover GitHub repositories personalized to their interests and preferences. The implementation uses:

1. **DeepSeek AI** for intelligent repository recommendations
2. **GitHub API** for fetching repository data
3. **Database Storage** to cache repositories and minimize API calls

### Key Components for Explore Page

#### 1. Database Storage

- Repositories are stored in the `repositories` table
- Saved repositories are linked through the `saved_repositories` table using foreign keys
- Each repository is cached to reduce GitHub API calls

#### 2. Repository Recommendation Flow

The recommendation system works as follows:

1. **User Login**: GitHub profile data is collected and analyzed
2. **User Preferences**: User can set explicit preferences in the profile page
3. **Explore Filters**: Users can further refine results with filters on the explore page
4. **AI Processing**: DeepSeek AI analyzes repositories, user profile, and preferences to determine the most relevant repositories

#### 3. Explore Page Features

- Initial load of 10 repositories
- "Show more" button to load 5 additional repositories
- Client-side filtering and sorting
- Rate limit handling with fallback to cached results
- Personalized recommendation explanations for each repository

## Chat Feature Overview

The SourceSeekr Chat feature integrates the DeepSeek language model with real-time GitHub API access, enabling intelligent, data-driven repository recommendations and insights.

### Key Components for Chat Feature

#### 1. Two-Phase API Communication

The chat implementation follows a two-phase approach:

1. **Phase 1: Request Planning**
   - User sends a message to the chat interface
   - The message is sent to the backend API endpoint
   - DeepSeek analyzes the user's query
   - DeepSeek outputs what GitHub data it needs in a structured JSON format

2. **Phase 2: Data Integration**
   - The backend retrieves the requested GitHub data from the GitHub API
   - The GitHub data is sent back to DeepSeek
   - DeepSeek formulates a comprehensive response incorporating the real data
   - The response includes Markdown-formatted links to GitHub resources
   - The frontend renders GitHub links as clickable elements

#### 2. JSON Request Format

DeepSeek requests GitHub data in this format:
```json
{
  "thinking": "Explanation of what data is needed and why",
  "github_requests": [
    {
      "type": "repository", 
      "query": "facebook/react"
    },
    {
      "type": "search",
      "query": "machine learning language:python stars:>1000",
      "params": {"limit": 5}
    }
  ]
}
```

#### 3. GitHub Data Types

The chat system supports these data types:
- `repository`: Details about a specific repository (owner/name)
- `search`: Search results for repositories matching criteria
- `trending`: Currently trending repositories
- `user`: GitHub user information (planned)

#### 4. Link Rendering

The frontend includes a specialized renderer that:
- Detects Markdown-formatted GitHub links in responses
- Converts them to clickable links
- Preserves the rest of the response formatting

## Implementation Files

### Explore Page Implementation
1. **`/lib/deepseek-service.ts`**: DeepSeek AI service for repository recommendations
2. **`/app/api/repositories/route.ts`**: API route for fetching and storing repositories
3. **`/app/explore/page.tsx`**: Frontend implementation of the Explore page

### Chat Implementation
1. **`/app/chat/page.tsx`**: Frontend chat interface
2. **`/app/api/chat/route.ts`**: Backend endpoint that handles the two-phase approach
3. **`/lib/github-api.ts`**: GitHub API integration for data fetching

## Usage Limitations

- GitHub API has rate limits (60 requests/hour for unauthenticated requests)
- DeepSeek API usage is tracked and may incur costs
- Repository caching is used to minimize API calls

## Future Improvements

1. Implement a more robust user preference system in the database
2. Add more advanced filtering options
3. Enhance the recommendation algorithm with collaborative filtering
4. Add category-based browsing for repositories
5. Implement repository similarity features
6. Add user profile data fetching in the chat feature
7. Improve the chat UI with repository preview cards
8. Add memory to the chat to track user preferences over time
9. Implement streaming responses for a more responsive chat experience
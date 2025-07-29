"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface GitHubData {
  type: string;
  data: any;
  query: string;
  error?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gitHubData, setGitHubData] = useState<GitHubData[]>([]);
  const [rateLimitedResponses, setRateLimitedResponses] = useState<Set<number>>(
    new Set()
  );
  const [authChecking, setAuthChecking] = useState(true); // Track if we're still checking auth status
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication status and redirect if not authenticated
  useEffect(() => {
    // When status changes from loading to either authenticated or unauthenticated
    if (status !== "loading") {
      if (status === "unauthenticated") {
        console.log("User not authenticated, redirecting to login");
        // Add cache-busting parameter to prevent caching issues
        const timestamp = Date.now();
        const callbackUrl = encodeURIComponent(`/chat?t=${timestamp}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
      }
      // Authentication check completed
      setAuthChecking(false);
    }
  }, [status, router]);

  // Add initial welcome message from the assistant and load previous messages from localStorage
  useEffect(() => {
    // Only proceed if user is authenticated or loading
    if (status === "unauthenticated") return;

    // Try to load saved messages from localStorage
    const savedMessages = localStorage.getItem("chatMessages");

    // Load rate-limited message timestamps
    try {
      const savedRateLimited = localStorage.getItem("rateLimitedResponses");
      if (savedRateLimited) {
        const timestamps = JSON.parse(savedRateLimited);
        setRateLimitedResponses(new Set(timestamps));
      }
    } catch (error) {
      console.error("Error loading rate-limited responses:", error);
    }

    if (savedMessages) {
      try {
        // Parse saved messages and convert timestamp strings back to Date objects
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));

        // Only set messages if we have at least one non-system message
        if (parsedMessages.some((msg: Message) => msg.role !== "system")) {
          setMessages(parsedMessages);
          return;
        }
      } catch (error) {
        console.error("Error loading saved messages:", error);
      }
    }

    // If no saved messages or error occurred, set initial messages
    setMessages([
      {
        role: "system",
        content:
          "You are SourceSeekr AI, a helpful assistant that helps users discover GitHub repositories based on their interests and needs. You can access GitHub data and provide recommendations with real-time data from the GitHub API when relevant to the user's query, but you can also have regular conversations without using GitHub data when appropriate.",
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: `Hello${
          session?.user?.name ? `, ${session.user.name}` : ""
        }! 👋 I'm your SourceSeekr AI assistant. I can help you find GitHub repositories based on your interests, answer questions about repositories, or provide programming guidance. You can also chat with me about general topics. What are you looking for today?`,
        timestamp: new Date(),
      },
    ]);
  }, [session, status]); // CORRECTED: Added 'status' to the dependency array

  // Auto-scroll to bottom when messages change and save to localStorage
  useEffect(() => {
    // Auto-scroll
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Save messages to localStorage
    if (messages.length > 0) {
      try {
        localStorage.setItem("chatMessages", JSON.stringify(messages));
      } catch (error) {
        console.error("Error saving messages to localStorage:", error);
      }
    }
  }, [messages]);

  // Save rate-limited responses to localStorage
  useEffect(() => {
    if (rateLimitedResponses.size > 0) {
      try {
        localStorage.setItem(
          "rateLimitedResponses",
          JSON.stringify(Array.from(rateLimitedResponses))
        );
      } catch (error) {
        console.error(
          "Error saving rate-limited responses to localStorage:",
          error
        );
      }
    }
  }, [rateLimitedResponses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Only send user and assistant messages, not system messages
      const conversationHistory = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Add the user's new message
      conversationHistory.push({
        role: "user",
        content: input,
      });

      // First, add a temporary "thinking" message
      const thinkingId = Date.now();
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: "Checking GitHub for the most up-to-date information...",
          timestamp: new Date(),
        },
      ]);

      // Call the backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Create a timestamp for the message
      const messageTimestamp = new Date();

      // Replace the temporary message with the real response
      setMessages((prevMessages) => {
        const newMessages = prevMessages.slice(0, -1); // Remove the thinking message
        return [
          ...newMessages,
          {
            role: "assistant",
            content: data.response,
            timestamp: messageTimestamp,
          },
        ];
      });

      // If this response was rate-limited, add its timestamp to our tracking Set
      if (data.rateLimit) {
        setRateLimitedResponses((prev) => {
          const newSet = new Set(prev);
          newSet.add(messageTimestamp.getTime());
          return newSet;
        });
      }

      // If there's GitHub data returned, store it
      if (data.githubData && data.githubData.length > 0) {
        setGitHubData(data.githubData);
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Replace the thinking message with an error
      setMessages((prevMessages) => {
        const newMessages = prevMessages.slice(0, -1); // Remove the thinking message
        return [
          ...newMessages,
          {
            role: "assistant",
            content:
              "Sorry, I encountered an error processing your request. Please try again.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for message timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Process message content to render GitHub links
  const renderMessageContent = (content: string) => {
    // Regular expression to match markdown links
    const linkRegex = /\[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\)/g;

    if (!linkRegex.test(content)) {
      // No GitHub links found
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    // Replace markdown links with actual links
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex because we used test() above
    linkRegex.lastIndex = 0;

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${match.index}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add the link
      const [fullMatch, linkText, linkUrl] = match;
      parts.push(
        <a
          key={`link-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {linkText}
        </a>
      );

      lastIndex = match.index + fullMatch.length;
    }

    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={`text-end`}>{content.substring(lastIndex)}</span>);
    }

    return <div className="whitespace-pre-wrap">{parts}</div>;
  };

  // Suggestions for common queries, including both GitHub and general questions
  const suggestions = [
    "Recommend JavaScript repositories for beginners",
    "What are the trending repositories this month?",
    "Find data visualization libraries in Python",
    "How to structure a React project?",
    "What is the difference between JavaScript and TypeScript?",
    "Tell me about software design patterns",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Clear chat history
  const handleClearChat = () => {
    const systemMessage = messages.find((m) => m.role === "system");
    const newMessages = systemMessage ? [systemMessage] : [];

    // Add welcome message
    newMessages.push({
      role: "assistant",
      content: `Hello${
        session?.user?.name ? `, ${session.user.name}` : ""
      }! 👋 I'm your SourceSeekr AI assistant. I can help you find GitHub repositories based on your interests, answer questions about repositories, or provide programming guidance. You can also chat with me about general topics. What are you looking for today?`,
      timestamp: new Date(),
    });

    setMessages(newMessages);
    setRateLimitedResponses(new Set());
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("rateLimitedResponses");
  };

  // Loading indicator for when the AI is "thinking"
  const LoadingIndicator = () => (
    <div className="flex items-center space-x-2 p-4 bg-primary/5 rounded-lg max-w-[80%]">
      <div
        className="w-4 h-4 rounded-full bg-primary/40 animate-pulse"
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className="w-4 h-4 rounded-full bg-primary/40 animate-pulse"
        style={{ animationDelay: "300ms" }}
      ></div>
      <div
        className="w-4 h-4 rounded-full bg-primary/40 animate-pulse"
        style={{ animationDelay: "600ms" }}
      ></div>
    </div>
  );

  // Show loading state while checking authentication
  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">
          Verifying authentication...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Chat with SourceSeekr AI</h1>
        <p className="text-muted-foreground text-center max-w-lg mb-3">
          Ask for repository recommendations, learn about GitHub trends, or get
          help with your coding journey.
        </p>
        <button
          onClick={handleClearChat}
          className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Clear chat history
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 rounded-lg border border-border bg-card">
        {messages
          .filter((m) => m.role !== "system")
          .map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                } rounded-lg p-3 shadow`}
              >
                <div className="flex-shrink-0 mr-3">
                  {message.role === "user" ? (
                    session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="User"
                        width={30}
                        height={30}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-bold text-sm">
                        {session?.user?.name?.charAt(0) || "U"}
                      </div>
                    )
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-primary-foreground"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {message.role === "user" ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <>
                      {renderMessageContent(message.content)}
                      {message.role === "assistant" &&
                        rateLimitedResponses.has(
                          message.timestamp.getTime()
                        ) && (
                          <div className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded inline-flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            GitHub rate limit exceeded - Responding without
                            GitHub data
                          </div>
                        )}
                    </>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}

        {isLoading && <LoadingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 3 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="bg-muted hover:bg-muted/80 px-3 py-2 rounded-full text-sm transition-colors text-muted-foreground hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about repository recommendations..."
          className="input flex-1"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn btn-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        SourceSeekr AI uses DeepSeek to provide GitHub repository
        recommendations with real-time data.
      </p>
    </div>
  );
}
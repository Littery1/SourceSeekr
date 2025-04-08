"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GitHubUser {
  login: string;
  name?: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
}

interface LanguageStats {
  language: string;
  percentage: number;
  color: string;
}

// Sample colors for languages
const languageColors: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#2b7489",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Ruby: "#701516",
  PHP: "#4F5D95",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Swift: "#ffac45",
  Kotlin: "#F18E33",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Other: "#8b8b8b"
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<GitHubUser | null>(null);
  const [languages, setLanguages] = useState<LanguageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User preferences
  const [preferences, setPreferences] = useState({
    interests: [] as string[],
    skillLevel: "intermediate",
    looking: [] as string[],
    preferredLanguages: [] as string[]
  });

  const skillLevels = ["beginner", "intermediate", "advanced", "expert"];
  
  const interestOptions = [
    "Web Development", "Mobile Apps", "Data Science", "Machine Learning",
    "Game Development", "DevOps", "Security", "Backend", "Frontend",
    "UI/UX", "Cloud Computing", "Blockchain", "IoT", "AR/VR"
  ];
  
  const lookingForOptions = [
    "Open Source Projects", "Learning Resources", "Beginner Friendly", 
    "Documentation", "Tools", "Libraries", "Frameworks", "Tutorials",
    "Sample Projects", "Collaborative Projects"
  ];

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          // In a real app, you would call your backend API that calls GitHub API with proper auth
          // This is just a mock example
          const mockUserData: GitHubUser = {
            login: session.user?.name || "user",
            name: session.user?.name || "User",
            bio: "Software developer passionate about web technologies",
            public_repos: 32,
            followers: 87,
            following: 45,
            avatar_url: session.user?.image || "/images/default.png",
            html_url: `https://github.com/${session.user?.email?.split('@')[0] || session.user?.name || "user"}`
          };
          
          setUserData(mockUserData);
          
          // Mock language data
          const mockLanguages: LanguageStats[] = [
            { language: "TypeScript", percentage: 38, color: languageColors.TypeScript },
            { language: "JavaScript", percentage: 28, color: languageColors.JavaScript },
            { language: "HTML", percentage: 15, color: languageColors.HTML },
            { language: "CSS", percentage: 12, color: languageColors.CSS },
            { language: "Python", percentage: 7, color: languageColors.Python }
          ];
          
          setLanguages(mockLanguages);
          
          // Load preferences from localStorage
          const savedPreferences = localStorage.getItem('sourceseekr-preferences');
          if (savedPreferences) {
            setPreferences(JSON.parse(savedPreferences));
          } else {
            // Set default preferences based on languages
            const defaultPreferredLanguages = mockLanguages
              .slice(0, 3)
              .map(lang => lang.language);
              
            const defaultPrefs = {
              ...preferences,
              preferredLanguages: defaultPreferredLanguages
            };
            
            setPreferences(defaultPrefs);
            localStorage.setItem('sourceseekr-preferences', JSON.stringify(defaultPrefs));
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError(
            err instanceof Error ? err.message : "Failed to fetch user data"
          );
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [session, status, router]);

  const handleInterestToggle = (interest: string) => {
    setPreferences(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
        
      const newPrefs = { ...prev, interests: newInterests };
      localStorage.setItem('sourceseekr-preferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  const handleLookingToggle = (item: string) => {
    setPreferences(prev => {
      const newLooking = prev.looking.includes(item)
        ? prev.looking.filter(i => i !== item)
        : [...prev.looking, item];
        
      const newPrefs = { ...prev, looking: newLooking };
      localStorage.setItem('sourceseekr-preferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  const handleLanguageToggle = (language: string) => {
    setPreferences(prev => {
      const newLanguages = prev.preferredLanguages.includes(language)
        ? prev.preferredLanguages.filter(l => l !== language)
        : [...prev.preferredLanguages, language];
        
      const newPrefs = { ...prev, preferredLanguages: newLanguages };
      localStorage.setItem('sourceseekr-preferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  const handleSkillLevelChange = (level: string) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, skillLevel: level };
      localStorage.setItem('sourceseekr-preferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/" className="btn btn-outline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="relative mb-16">
        {/* Banner Background */}
        <div className="h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-r from-primary/20 via-primary/40 to-background">
          {/* Removed the wave image and using a gradient instead */}
        </div>
        
        {/* Profile Picture and Basic Info */}
        <div className="absolute -bottom-12 left-8 flex items-end md:items-center space-x-6">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-primary/50 rounded-full blur-sm opacity-70"></div>
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-card">
              <Image 
                src={userData.avatar_url} 
                alt={userData.name || userData.login} 
                className="object-cover"
                fill
                sizes="(max-width: 768px) 96px, 128px"
                priority
              />
            </div>
          </div>
          <div className="pb-2 md:pb-0">
            <h1 className="text-xl md:text-3xl font-bold">{userData.name || userData.login}</h1>
            <p className="text-muted-foreground text-sm md:text-base">@{userData.login}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="absolute -bottom-12 right-8 hidden md:flex space-x-6">
          <div className="text-center">
            <span className="block text-2xl font-bold">{userData.public_repos}</span>
            <span className="text-muted-foreground text-sm">Repositories</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold">{userData.followers}</span>
            <span className="text-muted-foreground text-sm">Followers</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold">{userData.following}</span>
            <span className="text-muted-foreground text-sm">Following</span>
          </div>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="flex justify-center space-x-6 mb-8 md:hidden">
        <div className="text-center">
          <span className="block text-xl font-bold">{userData.public_repos}</span>
          <span className="text-muted-foreground text-xs">Repos</span>
        </div>
        <div className="text-center">
          <span className="block text-xl font-bold">{userData.followers}</span>
          <span className="text-muted-foreground text-xs">Followers</span>
        </div>
        <div className="text-center">
          <span className="block text-xl font-bold">{userData.following}</span>
          <span className="text-muted-foreground text-xs">Following</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Sidebar - GitHub Info */}
        <div>
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">About</h2>
            <p className="mb-4 text-muted-foreground">
              {userData.bio || "No bio available"}
            </p>
            
            <a 
              href={userData.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline w-full flex items-center justify-center gap-2 mb-4"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0 1 12 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48 3.97-1.32 6.833-5.054 6.833-9.458C22 6.463 17.522 2 12 2Z"></path>
              </svg>
              View GitHub Profile
            </a>
            
            <h3 className="font-semibold text-lg mb-3">Top Languages</h3>
            <div className="space-y-3">
              {languages.map((lang) => (
                <div key={lang.language} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{lang.language}</span>
                    <span>{lang.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${lang.percentage}%`,
                        backgroundColor: lang.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-bold mb-4">Skill Level</h2>
            <div className="space-y-2">
              {skillLevels.map((level) => (
                <label key={level} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="skillLevel"
                    value={level}
                    checked={preferences.skillLevel === level}
                    onChange={() => handleSkillLevelChange(level)}
                    className="h-4 w-4 text-primary border-input"
                  />
                  <span className="capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Preferences */}
        <div className="md:col-span-2 space-y-8">
          {/* Preferred Programming Languages */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-bold mb-4">Preferred Programming Languages</h2>
            <p className="text-muted-foreground mb-4">
              Select the languages you're most interested in to receive tailored repository recommendations.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(languageColors).map(([language, color]) => (
                <button
                  key={language}
                  onClick={() => handleLanguageToggle(language)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    preferences.preferredLanguages.includes(language)
                      ? 'text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  style={{
                    backgroundColor: preferences.preferredLanguages.includes(language) 
                      ? color 
                      : undefined
                  }}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>
          
          {/* Interests */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-bold mb-4">Areas of Interest</h2>
            <p className="text-muted-foreground mb-4">
              Select your areas of interest to help us recommend repositories that match your preferences.
            </p>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    preferences.interests.includes(interest)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          
          {/* Looking For */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-bold mb-4">I'm Looking For</h2>
            <p className="text-muted-foreground mb-4">
              Tell us what kind of repositories you're interested in discovering.
            </p>
            <div className="flex flex-wrap gap-2">
              {lookingForOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => handleLookingToggle(item)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    preferences.looking.includes(item)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          
          {/* No buttons needed here */}
        </div>
      </div>
    </div>
  );
}
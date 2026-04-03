import os
from typing import List

class RedditClient:
    def __init__(self):
        self.client_id = os.environ.get("REDDIT_CLIENT_ID", "").strip()
        self.client_secret = os.environ.get("REDDIT_CLIENT_SECRET", "").strip()
        self.user_agent = os.environ.get("REDDIT_USER_AGENT", "RFN:v2.0 (by AutoFactory)")
        
        self.is_mock_mode = not bool(self.client_id and self.client_secret)
        self._reddit = None
        
        if not self.is_mock_mode:
            try:
                import praw
                self._reddit = praw.Reddit(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    user_agent=self.user_agent,
                    read_only=True
                )
            except Exception as e:
                print(f"[Reddit Initialization Error]: {e} - Falling back to Mock State.")
                self.is_mock_mode = True

    def get_trending_topics(self, subreddit_name: str, limit: int = 5) -> List[str]:
        if self.is_mock_mode:
            # Simulated data returned automatically if PRAW APIs keys aren't set
            return [
                "AI hardware limits in 2026",
                "Self-hosted LLMs vs Closed APIs",
                "Automation and digital exoskeletons",
                "React Flow architecture optimization",
                "PRAW integration best practices"
            ]

        try:
            sub = self._reddit.subreddit(subreddit_name)
            topics = []
            for post in sub.hot(limit=limit):
                topics.append(post.title)
            return topics
        except Exception as e:
            return [f"[Reddit Error fetching r/{subreddit_name}]: {str(e)}"]

    def submit_post(self, subreddit_name: str, title: str, body: str) -> str:
        if self.is_mock_mode:
            return f"[MOCK] Successfully 'submitted' to r/{subreddit_name}: {title}"
        
        try:
            # Note: Requires account authentication setup beyond read_only
            sub = self._reddit.subreddit(subreddit_name)
            submission = sub.submit(title=title, selftext=body)
            return f"Published! https://reddit.com{submission.permalink}"
        except Exception as e:
            return f"Failed to publish: {str(e)}"

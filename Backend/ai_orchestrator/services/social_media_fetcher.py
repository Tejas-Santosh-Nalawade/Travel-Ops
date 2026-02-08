"""
Social Media Content Fetcher
Fetches real content from Instagram and YouTube for AI analysis
"""
from typing import Dict, Any, Optional
import re
import requests
from config import settings


class SocialMediaFetcher:
    """
    Fetches actual content from social media platforms for destination extraction.
    """

    def __init__(self):
        self.youtube_api_key = settings.YOUTUBE_API_KEY
        self.enable_fetching = settings.ENABLE_CONTENT_FETCHING

    def fetch_content(self, url: str, platform: str) -> Dict[str, Any]:
        """
        Fetch content from social media URL.

        Args:
            url: The social media URL
            platform: 'instagram' or 'youtube'

        Returns:
            Dict with content data (title, description, tags, etc.)
        """
        if not self.enable_fetching:
            return self._fallback_content(url, platform)

        try:
            if platform == 'youtube':
                return self._fetch_youtube_content(url)
            elif platform == 'instagram':
                return self._fetch_instagram_content(url)
            else:
                return self._fallback_content(url, platform)
        except Exception as e:
            print(f"Error fetching {platform} content: {e}")
            return self._fallback_content(url, platform)

    def _fetch_youtube_content(self, url: str) -> Dict[str, Any]:
        """
        Fetch YouTube video content using YouTube Data API v3.
        """
        video_id = self._extract_youtube_video_id(url)
        if not video_id:
            return self._fallback_content(url, 'youtube')

        # If API key is not configured, try oEmbed (limited data)
        if not self.youtube_api_key:
            return self._fetch_youtube_oembed(url, video_id)

        # Use YouTube Data API for full metadata
        try:
            api_url = f"https://www.googleapis.com/youtube/v3/videos"
            params = {
                'part': 'snippet,contentDetails',
                'id': video_id,
                'key': self.youtube_api_key
            }

            response = requests.get(api_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if not data.get('items'):
                return self._fallback_content(url, 'youtube')

            video = data['items'][0]['snippet']

            return {
                'platform': 'youtube',
                'video_id': video_id,
                'title': video.get('title', ''),
                'description': video.get('description', ''),
                'tags': video.get('tags', []),
                'channel_name': video.get('channelTitle', ''),
                'published_at': video.get('publishedAt', ''),
                'thumbnail': video.get('thumbnails', {}).get('high', {}).get('url', ''),
                'success': True
            }
        except Exception as e:
            print(f"YouTube API error: {e}")
            return self._fetch_youtube_oembed(url, video_id)

    def _fetch_youtube_oembed(self, url: str, video_id: str) -> Dict[str, Any]:
        """
        Fetch YouTube content using oEmbed (limited but no API key needed).
        """
        try:
            oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
            response = requests.get(oembed_url, timeout=10)
            response.raise_for_status()
            data = response.json()

            return {
                'platform': 'youtube',
                'video_id': video_id,
                'title': data.get('title', ''),
                'description': '',  # oEmbed doesn't provide description
                'tags': [],
                'channel_name': data.get('author_name', ''),
                'thumbnail': data.get('thumbnail_url', ''),
                'success': True,
                'limited': True  # Flag that this is limited data
            }
        except Exception as e:
            print(f"YouTube oEmbed error: {e}")
            return self._fallback_content(url, 'youtube')

    def _fetch_instagram_content(self, url: str) -> Dict[str, Any]:
        """
        Fetch Instagram post content using oEmbed API.
        """
        try:
            # Instagram oEmbed endpoint (public, no API key needed)
            oembed_url = f"https://graph.facebook.com/v18.0/instagram_oembed?url={url}&access_token=IGQWRPN0ZAIRHc1YUk0RVZAqOFhEdkNiQXpZAR0VxZAm5SZAlp2UHlBV18tWExsZAjJ3MkVWc25YLW1sSDhtOHpoOWtua1N5TXFiYUJaZAFRVRUVWUHhBMFFEZAlNJWFZAnVHM3ZADVjV2Ry1yMlRzX2l3dFBWNkdxbEkZD&omitscript=true"

            response = requests.get(oembed_url, timeout=10)

            # If official oEmbed fails, try public endpoint
            if response.status_code != 200:
                oembed_url = f"https://api.instagram.com/oembed?url={url}"
                response = requests.get(oembed_url, timeout=10)

            response.raise_for_status()
            data = response.json()

            return {
                'platform': 'instagram',
                'title': data.get('title', ''),
                'author_name': data.get('author_name', ''),
                'author_url': data.get('author_url', ''),
                'thumbnail': data.get('thumbnail_url', ''),
                'html': data.get('html', ''),
                'success': True
            }
        except Exception as e:
            print(f"Instagram oEmbed error: {e}")
            # Fallback: Try to extract from URL structure
            return self._analyze_instagram_url_structure(url)

    def _analyze_instagram_url_structure(self, url: str) -> Dict[str, Any]:
        """
        Analyze Instagram URL structure to extract basic info.
        """
        # Extract username from URL if possible
        username_match = re.search(r'instagram\.com/([^/]+)', url)
        username = username_match.group(1) if username_match else ''

        # Check URL for location/place tags
        location_hints = []
        url_lower = url.lower()

        # Common travel location keywords in Instagram URLs
        location_keywords = ['goa', 'mumbai', 'delhi', 'jaipur', 'kerala', 'bangalore',
                           'chennai', 'udaipur', 'rajasthan', 'kashmir', 'ladakh',
                           'manali', 'shimla', 'darjeeling', 'rishikesh', 'varanasi']

        for keyword in location_keywords:
            if keyword in url_lower:
                location_hints.append(keyword.capitalize())

        return {
            'platform': 'instagram',
            'title': f"Instagram post by {username}" if username else "Instagram travel post",
            'author_name': username,
            'location_hints': location_hints,
            'success': False,
            'fallback': True
        }

    def _extract_youtube_video_id(self, url: str) -> Optional[str]:
        """
        Extract video ID from various YouTube URL formats.
        """
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',  # Standard and short URLs
            r'(?:embed\/)([0-9A-Za-z_-]{11})',   # Embed URLs
            r'(?:watch\?v=)([0-9A-Za-z_-]{11})'  # Watch URLs
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    def _fallback_content(self, url: str, platform: str) -> Dict[str, Any]:
        """
        Fallback when content fetching fails - analyze URL text.
        """
        url_lower = url.lower()

        # Extract keywords from URL
        keywords = []
        location_keywords = ['goa', 'mumbai', 'delhi', 'jaipur', 'kerala', 'bangalore',
                           'chennai', 'udaipur', 'rajasthan', 'kashmir', 'ladakh',
                           'manali', 'shimla', 'darjeeling', 'rishikesh', 'varanasi',
                           'beach', 'mountain', 'desert', 'hill', 'temple', 'palace']

        for keyword in location_keywords:
            if keyword in url_lower:
                keywords.append(keyword)

        return {
            'platform': platform,
            'title': f"{platform.capitalize()} travel content",
            'description': f"URL contains: {', '.join(keywords)}" if keywords else "Travel content",
            'keywords': keywords,
            'success': False,
            'fallback': True
        }


# Global instance
social_media_fetcher = SocialMediaFetcher()

# Social Media Content Fetching Setup

The AI Orchestrator now fetches **real content** from Instagram and YouTube to extract travel destinations dynamically.

## Features

### YouTube Integration
- **Full API Mode**: Uses YouTube Data API v3 for complete video metadata (title, description, tags, channel info)
- **oEmbed Mode**: Fallback mode using YouTube's public oEmbed endpoint (no API key needed, limited data)
- **URL Analysis**: Fallback to intelligent URL pattern matching if fetching fails

### Instagram Integration  
- **oEmbed API**: Uses Instagram's public oEmbed endpoint for post metadata
- **URL Analysis**: Extracts location hints from URL structure
- **Fallback Mode**: Intelligent keyword extraction from URLs

## Setup Instructions

### Option 1: Quick Start (No API Keys Needed)
The system works out-of-the-box with oEmbed endpoints:
- YouTube: Limited metadata (title, channel name)
- Instagram: Post title and author

No configuration needed! Just paste URLs and it works.

### Option 2: Enhanced Mode (Recommended for Production)

For full YouTube video data (descriptions, tags, etc.), get a YouTube API key:

1. **Get YouTube Data API v3 Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "YouTube Data API v3"
   - Create credentials (API Key)
   - Copy your API key

2. **Configure the API Key:**
   
   Create `.env` file in `Backend/ai_orchestrator/`:
   ```bash
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ENABLE_CONTENT_FETCHING=true
   ```

3. **Restart the server:**
   ```bash
   uvicorn main:app --reload
   ```

## How It Works

### 1. Content Fetching Flow
```
User pastes URL → Fetch content → Extract metadata → AI analyzes → Suggest destinations
```

### 2. For YouTube URLs:
```python
URL: https://youtube.com/watch?v=abc123

Fetched Data:
- Video Title: "Amazing Rajasthan Trip - Jaipur to Udaipur"
- Description: "Join us on our incredible journey through..."
- Tags: ["rajasthan", "jaipur", "udaipur", "travel", "india"]
- Channel: "Travel Vibes"

AI Analysis → Destinations: ["Jaipur", "Udaipur", "Jodhpur"]
```

### 3. For Instagram URLs:
```python
URL: https://instagram.com/p/abc123

Fetched Data:
- Post Title: "Beach vibes at Goa 🌊"
- Author: "traveler_india"
- Location hints from URL structure

AI Analysis → Destinations: ["Mumbai", "Goa", "Mangalore"]
```

## Testing

### Test YouTube (Works Without API Key)
```bash
curl -X POST http://localhost:8000/api/v1/plan/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 50000,
    "cities": [{"city": "AI_EXTRACT", "duration_days": 5, "arrival_date": "2024-01-01", "departure_date": "2024-01-06"}],
    "preference": "balanced",
    "number_of_travelers": 2,
    "accommodation_type": "mid_range",
    "social_media_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "social_platform": "youtube"
  }'
```

### Test Instagram
Replace the URL with any Instagram post URL:
```json
{
  "social_media_url": "https://www.instagram.com/p/abc123/",
  "social_platform": "instagram"
}
```

## Supported URL Formats

### YouTube
- ✅ `https://youtube.com/watch?v=VIDEO_ID`
- ✅ `https://youtu.be/VIDEO_ID`
- ✅ `https://www.youtube.com/embed/VIDEO_ID`
- ✅ `https://m.youtube.com/watch?v=VIDEO_ID`

### Instagram
- ✅ `https://instagram.com/p/POST_ID/`
- ✅ `https://www.instagram.com/reel/REEL_ID/`
- ✅ `https://www.instagram.com/tv/VIDEO_ID/`

## Logs and Debugging

The system logs content fetching activity:
```
Fetching content from youtube: https://youtube.com/watch?v=...
✓ Successfully fetched video metadata
✓ Extracted 3 destinations from content
```

Check console output for:
- Content fetching success/failure
- Fallback modes being used
- AI extraction results

## Fallback Hierarchy

1. **Best**: Full API (YouTube Data API v3) → Complete metadata
2. **Good**: oEmbed API → Limited but reliable metadata  
3. **OK**: URL Analysis → Pattern matching and keyword extraction
4. **Fallback**: Default destinations based on platform

## Rate Limits

- **YouTube Data API**: 10,000 quota units/day (1 video fetch = 1 unit)
- **YouTube oEmbed**: No rate limit (public endpoint)
- **Instagram oEmbed**: No published rate limit

## Privacy & Security

- No user data is stored
- API keys are stored securely in `.env`
- Only public post/video metadata is fetched
- No authentication/login required

## Troubleshooting

### "Could not fetch content"
- Check internet connection
- Verify URL is public and accessible
- Try different URL format
- System will use URL analysis fallback

### "YouTube API quota exceeded"
- Switch to oEmbed mode (remove YOUTUBE_API_KEY)
- Wait for daily quota reset (midnight PST)
- System automatically falls back to oEmbed

### "No destinations found"
- AI will suggest default destinations based on platform
- Try rephrasing or using different influencer content
- Manual destination selection still available

## Examples

### Example 1: Rajasthan Travel Vlog
```
Input: YouTube URL with title "10 Days in Rajasthan | Jaipur, Udaipur, Jodhpur"
Output: ["Jaipur", "Udaipur", "Jodhpur"]
Confidence: 0.95
```

### Example 2: Beach Instagram Post
```
Input: Instagram post with location tag "Goa Beaches"
Output: ["Mumbai", "Goa", "Mangalore"]
Confidence: 0.85
```

### Example 3: Generic Travel URL
```
Input: YouTube URL without clear location mentions
Output: ["Mumbai", "Pune", "Goa"] (Default popular route)
Confidence: 0.60
```

## Future Enhancements

- 🔄 Instagram Graph API integration (requires app review)
- 🎬 YouTube video transcript analysis
- 🏷️ Hashtag and mention parsing
- 📍 GPS coordinate extraction from EXIF data
- 🗺️ Multi-language destination name recognition

## Support

For issues or questions:
1. Check logs in console
2. Verify URL formats
3. Test with sample URLs first
4. File issue on GitHub

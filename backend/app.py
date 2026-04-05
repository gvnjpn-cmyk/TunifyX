"""
TunifyX Backend - Flask API
Combines SpotifyScraper metadata + YouTube audio streaming
"""

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import re
import requests
import json
import urllib.parse

app = Flask(__name__)
CORS(app)

# ─── SpotifyScraper Integration ─────────────────────────────────────────────

def get_spotify_client():
    try:
        from spotify_scraper import SpotifyClient
        return SpotifyClient(browser_type="requests", use_cache=True, rate_limit=True)
    except ImportError:
        return None

# ─── YouTube Search (no API key needed via scrape) ──────────────────────────

def search_youtube(query, max_results=5):
    """Search YouTube without API key using scraping approach"""
    try:
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.youtube.com/results?search_query={encoded_query}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=10)
        
        # Extract video IDs from initial data
        match = re.search(r'var ytInitialData = ({.*?});</script>', resp.text, re.DOTALL)
        if not match:
            return []
        
        data = json.loads(match.group(1))
        videos = []
        
        # Navigate JSON to find video results
        contents = (data.get("contents", {})
                       .get("twoColumnSearchResultsRenderer", {})
                       .get("primaryContents", {})
                       .get("sectionListRenderer", {})
                       .get("contents", []))
        
        for section in contents:
            items = (section.get("itemSectionRenderer", {})
                            .get("contents", []))
            for item in items:
                if "videoRenderer" in item:
                    v = item["videoRenderer"]
                    vid_id = v.get("videoId")
                    title_runs = v.get("title", {}).get("runs", [])
                    title = title_runs[0]["text"] if title_runs else "Unknown"
                    
                    duration_text = (v.get("lengthText", {})
                                      .get("simpleText", "0:00"))
                    
                    thumbnail = ""
                    thumbs = v.get("thumbnail", {}).get("thumbnails", [])
                    if thumbs:
                        thumbnail = thumbs[-1].get("url", "")
                    
                    channel_runs = (v.get("ownerText", {})
                                     .get("runs", [{}]))
                    channel = channel_runs[0].get("text", "") if channel_runs else ""
                    
                    if vid_id:
                        videos.append({
                            "videoId": vid_id,
                            "title": title,
                            "duration": duration_text,
                            "thumbnail": thumbnail,
                            "channel": channel,
                            "url": f"https://www.youtube.com/watch?v={vid_id}"
                        })
                    
                    if len(videos) >= max_results:
                        break
            if len(videos) >= max_results:
                break
        
        return videos
    except Exception as e:
        print(f"YouTube search error: {e}")
        return []


def search_youtube_api(query, api_key, max_results=5):
    """Search YouTube with official API key"""
    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "key": api_key
        }
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        
        videos = []
        for item in data.get("items", []):
            vid_id = item["id"]["videoId"]
            snippet = item["snippet"]
            videos.append({
                "videoId": vid_id,
                "title": snippet.get("title", "Unknown"),
                "duration": "",
                "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                "channel": snippet.get("channelTitle", ""),
                "url": f"https://www.youtube.com/watch?v={vid_id}"
            })
        return videos
    except Exception as e:
        print(f"YouTube API error: {e}")
        return []


# ─── Routes ─────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "TunifyX"})


@app.route("/api/spotify/track")
def spotify_track():
    """Get Spotify track metadata by URL"""
    url = request.args.get("url", "")
    if not url or "spotify.com/track" not in url:
        return jsonify({"error": "Invalid Spotify track URL"}), 400
    
    client = get_spotify_client()
    if not client:
        return jsonify({"error": "spotifyscraper not installed. Run: pip install spotifyscraper"}), 500
    
    try:
        track = client.get_track_info(url)
        client.close()
        
        artists = track.get("artists", [])
        artist_names = [a.get("name", "") for a in artists if a.get("name")]
        
        result = {
            "id": track.get("id", ""),
            "name": track.get("name", "Unknown"),
            "artists": artist_names,
            "album": track.get("album", {}).get("name", "") if track.get("album") else "",
            "duration_ms": track.get("duration_ms", 0),
            "preview_url": track.get("preview_url", ""),
            "image": "",
            "spotify_url": url
        }
        
        # Get album art
        album = track.get("album", {})
        if album and album.get("images"):
            result["image"] = album["images"][0].get("url", "")
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/spotify/playlist")
def spotify_playlist():
    """Get Spotify playlist metadata"""
    url = request.args.get("url", "")
    if not url or "spotify.com/playlist" not in url:
        return jsonify({"error": "Invalid Spotify playlist URL"}), 400
    
    client = get_spotify_client()
    if not client:
        return jsonify({"error": "spotifyscraper not installed"}), 500
    
    try:
        playlist = client.get_playlist_info(url)
        client.close()
        return jsonify(playlist)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/spotify/artist")
def spotify_artist():
    """Get Spotify artist metadata"""
    url = request.args.get("url", "")
    if not url or "spotify.com/artist" not in url:
        return jsonify({"error": "Invalid Spotify artist URL"}), 400
    
    client = get_spotify_client()
    if not client:
        return jsonify({"error": "spotifyscraper not installed"}), 500
    
    try:
        artist = client.get_artist_info(url)
        client.close()
        return jsonify(artist)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/youtube/search")
def youtube_search():
    """Search YouTube for a track"""
    query = request.args.get("q", "")
    api_key = request.args.get("apiKey", "")
    max_results = int(request.args.get("limit", 5))
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    if api_key:
        results = search_youtube_api(query, api_key, max_results)
    else:
        results = search_youtube(query, max_results)
    
    return jsonify({"results": results, "query": query})


@app.route("/api/resolve")
def resolve_track():
    """
    Full resolution: Spotify URL → metadata + YouTube match
    This is the main endpoint TunifyX frontend calls.
    """
    spotify_url = request.args.get("spotifyUrl", "")
    yt_api_key = request.args.get("ytApiKey", "")
    
    if not spotify_url:
        return jsonify({"error": "spotifyUrl is required"}), 400
    
    client = get_spotify_client()
    track_data = {}
    
    # Step 1: Get Spotify metadata
    if client and "spotify.com/track" in spotify_url:
        try:
            track = client.get_track_info(spotify_url)
            client.close()
            
            artists = track.get("artists", [])
            artist_names = [a.get("name", "") for a in artists if a.get("name")]
            
            album = track.get("album", {}) or {}
            image = ""
            if album.get("images"):
                image = album["images"][0].get("url", "")
            
            track_data = {
                "name": track.get("name", "Unknown"),
                "artists": artist_names,
                "album": album.get("name", ""),
                "duration_ms": track.get("duration_ms", 0),
                "preview_url": track.get("preview_url", ""),
                "image": image,
                "spotify_url": spotify_url
            }
        except Exception as e:
            track_data = {"error": f"Spotify scrape failed: {e}"}
    
    # Step 2: Search YouTube
    yt_results = []
    if track_data.get("name"):
        query = f"{track_data['name']} {' '.join(track_data.get('artists', [])[:1])} official audio"
        if yt_api_key:
            yt_results = search_youtube_api(query, yt_api_key, 3)
        else:
            yt_results = search_youtube(query, 3)
    
    return jsonify({
        "track": track_data,
        "youtube": yt_results,
        "youtubeEmbed": f"https://www.youtube.com/embed/{yt_results[0]['videoId']}?autoplay=1" if yt_results else ""
    })


@app.route("/api/youtube/direct-search")
def direct_search():
    """Search YouTube directly by song name (no Spotify URL needed)"""
    name = request.args.get("name", "")
    artist = request.args.get("artist", "")
    yt_api_key = request.args.get("ytApiKey", "")
    
    if not name:
        return jsonify({"error": "name is required"}), 400
    
    query = f"{name} {artist} official audio".strip()
    
    if yt_api_key:
        results = search_youtube_api(query, yt_api_key, 5)
    else:
        results = search_youtube(query, 5)
    
    return jsonify({"results": results, "query": query})


if __name__ == "__main__":
    print("🎵 TunifyX Backend starting on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)

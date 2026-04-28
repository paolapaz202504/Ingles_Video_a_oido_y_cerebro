import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { STANDARD_USER_AGENT } from "../utils/helpers.js"; // La ruta ahora es relativa a la nueva ubicación
import { CacheManager } from "../utils/cacheManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class VideoModel {
  static async getLibraryVideos() {
    // Usamos CacheManager (Google Cloud Storage) en lugar del disco local
    const analyses = await CacheManager.getAllAnalyses();
    const videos = [];
    
    for (const analysis of analyses) {
      // CacheManager ya devuelve el objeto JSON parseado y listo
      if (analysis && analysis.videoUrl) {
        let platformName = analysis.platform || "otro";
        if (!analysis.platform) {
          if (/youtu\.be|youtube\.com/i.test(analysis.videoUrl)) platformName = "youtube";
          else if (/x\.com|twitter\.com/i.test(analysis.videoUrl)) platformName = "x";
          else if (/tiktok\.com/i.test(analysis.videoUrl)) platformName = "tiktok";
          else if (/facebook\.com/i.test(analysis.videoUrl)) platformName = "facebook";
          else if (/instagram\.com/i.test(analysis.videoUrl)) platformName = "instagram";
        }
        videos.push({
          url: analysis.videoUrl,
          title: analysis.videoTitleGenerated || analysis.videoTitle || "Sin título",
          description: analysis.videoDescriptionGenerated || analysis.videoDescription || "",
          thumbnail: analysis.videoThumbnail || "",
          category: analysis.category || "General",
          tags: analysis.tags || [],
          date: analysis.generatedDate || "",
          platform: platformName,
          totalTime: analysis.totalTime || "",
          createdBy: analysis.createdBy || ""
        });
      }
    }
    return videos;
  }

  static async getTwitterDirectUrl(videoUrl) {
    const tweetIdMatch = videoUrl.match(/status\/(\d+)/);
    if (!tweetIdMatch) return null;
    const tweetId = tweetIdMatch[1];
    const apis = [`https://api.vxtwitter.com/Twitter/status/${tweetId}`, `https://api.fxtwitter.com/Twitter/status/${tweetId}`, `https://api.fixupx.com/Twitter/status/${tweetId}`];
    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, { headers: { "User-Agent": STANDARD_USER_AGENT, "Accept": "application/json" } });
        if (response.ok) {
          const data = await response.json();
          const mediaUrl = data?.mediaURLs?.[0] || (data?.media_extended && data.media_extended.find(m => m.type === 'video')?.url);
          const thumbnail = (data?.media_extended && data.media_extended.find(m => m.type === 'video')?.thumbnail_url) || "";
          if (mediaUrl) return { url: mediaUrl, thumbnail };
        }
      } catch (e) {}
    }
    return null;
  }

  static async getTiktokDirectUrl(videoUrl) {
    try {
      const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`, { headers: { "User-Agent": STANDARD_USER_AGENT, "Accept": "application/json" } });
      if (response.ok) { 
        const data = await response.json(); 
        if (data?.data?.play) {
          const playUrl = data.data.play.startsWith('http') ? data.data.play : `https://www.tikwm.com${data.data.play}`;
          const coverUrl = data.data.cover ? (data.data.cover.startsWith('http') ? data.data.cover : `https://www.tikwm.com${data.data.cover}`) : "";
          return { url: playUrl, thumbnail: coverUrl };
        }
      }
    } catch (e) {} 
    return null;
  }
}
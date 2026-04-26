import fetch from "node-fetch";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { STANDARD_USER_AGENT } from "../utils/helpers.js"; // La ruta ahora es relativa a la nueva ubicación

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class VideoModel {
  static async getLibraryVideos() {
    const CACHE_GEMINI_DIR = path.join(__dirname, "../../cache/gemini_analysis"); // Ruta corregida para apuntar a la carpeta cache en la raíz
    const files = await readdir(CACHE_GEMINI_DIR).catch(() => []);
    const videos = [];
    
    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const content = await readFile(path.join(CACHE_GEMINI_DIR, file), "utf8");
          const parsed = JSON.parse(content);
          if (parsed.analysis && parsed.videoUrl) {
            let platformName = parsed.analysis.platform || "otro";
            if (!parsed.analysis.platform) {
              if (/youtu\.be|youtube\.com/i.test(parsed.videoUrl)) platformName = "youtube";
              else if (/x\.com|twitter\.com/i.test(parsed.videoUrl)) platformName = "x";
              else if (/tiktok\.com/i.test(parsed.videoUrl)) platformName = "tiktok";
              else if (/facebook\.com/i.test(parsed.videoUrl)) platformName = "facebook";
              else if (/instagram\.com/i.test(parsed.videoUrl)) platformName = "instagram";
            }
            videos.push({
              url: parsed.videoUrl,
              title: parsed.analysis.videoTitleGenerated || parsed.analysis.videoTitle || "Sin título",
              description: parsed.analysis.videoDescriptionGenerated || parsed.analysis.videoDescription || "",
              thumbnail: parsed.analysis.videoThumbnail || "",
              category: parsed.analysis.category || "General",
              tags: parsed.analysis.tags || [],
              date: parsed.analysis.generatedDate || "",
              platform: platformName,
              totalTime: parsed.analysis.totalTime || "",
              createdBy: parsed.analysis.createdBy || ""
            });
          }
        } catch (err) {}
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
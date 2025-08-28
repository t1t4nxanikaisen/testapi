import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Extract Vidnest embed link
 * @param {string} anilistId
 * @param {string} episode
 * @param {string} lang - default "hindi"
 * @returns {Promise<{source: string, url: string} | null>}
 */
export async function extractVidnest(anilistId, episode, lang = "hindi") {
  try {
    const url = `https://vidnest.fun/anime/${anilistId}/${episode}/${lang}`;

    // Fetch Vidnest page
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    // Parse iframe embed
    const $ = cheerio.load(data);
    const iframe = $("iframe").attr("src");

    if (!iframe) {
      throw new Error("Vidnest: no iframe found");
    }

    return {
      source: "vidnest",
      url: iframe,
    };
  } catch (err) {
    console.error("Vidnest extractor error:", err.message);
    return null;
  }
}

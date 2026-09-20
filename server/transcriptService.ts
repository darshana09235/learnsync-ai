import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptItem {
  text: string;
  startSeconds: number;
  durationSeconds: number;
}

export interface TranscriptSegment {
  segmentId: string;
  startSeconds: number;
  endSeconds: number;
  transcriptText: string;
  classification?: 'INSTRUCTIONAL' | 'LOW_SIGNAL' | 'TRANSITIONAL';
  confidence?: number;
  reason?: string;
}

export interface VideoFullDetails {
  videoId: string;
  title: string;
  authorName: string;
  description: string;
  durationSeconds: number;
  thumbnailUrl: string;
  hasTranscript: boolean;
  transcriptItems: TranscriptItem[];
  transcriptSegments: TranscriptSegment[];
  fullTranscriptText: string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust YouTube Scraper & Transcript Extractor
 * Attempts multiple strategies to extract accurate video details and timed transcripts.
 */
export async function fetchYouTubeVideoDetailsAndTranscript(
  videoIdOrUrl: string
): Promise<VideoFullDetails> {
  let videoId = '';
  const videoMatch = videoIdOrUrl.match(
    /(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/v\/|shorts\/)([^"&?/\s]{11})/
  );
  if (videoMatch && videoMatch[1]) {
    videoId = videoMatch[1];
  } else if (/^[a-zA-Z0-9_-]{11}$/.test(videoIdOrUrl.trim())) {
    videoId = videoIdOrUrl.trim();
  }

  let title = '';
  let authorName = '';
  let description = '';
  let durationSeconds = 720;
  let thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600';

  let rawTranscriptItems: TranscriptItem[] = [];

  // Strategy 0: YouTube Data API (Secure fallback if key exists)
  if (videoId && process.env.YOUTUBE_API_KEY) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
      const apiRes = await fetch(apiUrl, { signal: AbortSignal.timeout(4000) });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          if (item.snippet) {
            title = decodeHtmlEntities(item.snippet.title || '');
            authorName = decodeHtmlEntities(item.snippet.channelTitle || '');
            description = decodeHtmlEntities(item.snippet.description || '').substring(0, 1000);
            thumbnailUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || thumbnailUrl;
          }
          const durationStr = item.contentDetails?.duration;
          if (durationStr) {
            // Parse ISO 8601 duration (e.g., PT1H2M10S)
            const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const h = parseInt(match[1] || '0', 10);
              const m = parseInt(match[2] || '0', 10);
              const s = parseInt(match[3] || '0', 10);
              const totalSecs = h * 3600 + m * 60 + s;
              if (totalSecs > 0) durationSeconds = totalSecs;
            }
          }
        }
      }
    } catch (err) {
      console.warn('YouTube Data API metadata fetch failed:', err);
    }
  }

  // Strategy 1: Fetch YouTube Watch Page HTML to parse videoDetails & captionTracks directly
  if (videoId) {
    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(4500),
      });

      if (response.ok) {
        const html = await response.text();

        // Extract title from <title> tag
        const matchTitle = html.match(/<title>(.*?)<\/title>/i);
        if (matchTitle && matchTitle[1] && !title) {
          const raw = matchTitle[1].replace(' - YouTube', '').trim();
          if (raw) title = decodeHtmlEntities(raw);
        }

        // Extract ytInitialPlayerResponse JSON
        const playerResponseMatch = html.match(
          /ytInitialPlayerResponse\s*=\s*({.+?});(?:var\s|window\[|<)/s
        ) || html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);

        if (playerResponseMatch && playerResponseMatch[1]) {
          try {
            const playerResponse = JSON.parse(playerResponseMatch[1]);
            const details = playerResponse.videoDetails;
            if (details) {
              if (details.title && !title) title = decodeHtmlEntities(details.title);
              if (details.author && !authorName) authorName = decodeHtmlEntities(details.author);
              if (details.shortDescription && !description) description = decodeHtmlEntities(details.shortDescription.substring(0, 1000));
              if (details.lengthSeconds && durationSeconds === 720) {
                const parsedDur = parseInt(details.lengthSeconds, 10);
                if (!isNaN(parsedDur) && parsedDur > 0) durationSeconds = parsedDur;
              }
              if (details.thumbnail?.thumbnails?.length > 0 && thumbnailUrl.includes('hqdefault.jpg')) {
                const thumbs = details.thumbnail.thumbnails;
                thumbnailUrl = thumbs[thumbs.length - 1].url;
              }
            }

            // Extract captions from playerResponse
            const captionTracks =
              playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

            if (Array.isArray(captionTracks) && captionTracks.length > 0) {
              // Prefer English or first available track
              const preferredTrack =
                captionTracks.find(
                  (t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')
                ) || captionTracks[0];

              if (preferredTrack && preferredTrack.baseUrl) {
                try {
                  const timedTextUrl = preferredTrack.baseUrl + '&fmt=json3';
                  const timedRes = await fetch(timedTextUrl, {
                    signal: AbortSignal.timeout(3500),
                  });
                  if (timedRes.ok) {
                    const json3 = await timedRes.json();
                    if (Array.isArray(json3.events)) {
                      for (const ev of json3.events) {
                        if (ev.segs && Array.isArray(ev.segs)) {
                          const segText = ev.segs.map((s: any) => s.utf8 || '').join('').trim();
                          if (segText) {
                            rawTranscriptItems.push({
                              text: decodeHtmlEntities(segText),
                              startSeconds: Math.floor((ev.tStartMs || 0) / 1000),
                              durationSeconds: Math.max(1, Math.floor((ev.dDurationMs || 0) / 1000)),
                            });
                          }
                        }
                      }
                    }
                  }
                } catch {
                  // Fallback: try raw XML timedtext url
                  try {
                    const xmlRes = await fetch(preferredTrack.baseUrl, {
                      signal: AbortSignal.timeout(3000),
                    });
                    if (xmlRes.ok) {
                      const xmlText = await xmlRes.text();
                      const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g;
                      let m;
                      while ((m = regex.exec(xmlText)) !== null) {
                        const start = Math.floor(parseFloat(m[1]));
                        const dur = Math.floor(parseFloat(m[2]));
                        const text = decodeHtmlEntities(m[3]);
                        if (text) {
                          rawTranscriptItems.push({
                            text,
                            startSeconds: start,
                            durationSeconds: Math.max(1, dur),
                          });
                        }
                      }
                    }
                  } catch {
                    // Ignore timedtext fetch error
                  }
                }
              }
            }
          } catch (jsonErr) {
            console.warn('Failed to parse ytInitialPlayerResponse JSON:', jsonErr);
          }
        }
      }
    } catch (e) {
      console.warn('HTML scrape timed out or failed, falling back:', e);
    }
  }

  // Strategy 2: If transcript is still empty, use youtube-transcript library
  if (rawTranscriptItems.length === 0 && videoId) {
    const fallbackLangs = ['en', 'es', 'fr', 'de', undefined];
    for (let i = 0; i < fallbackLangs.length; i++) {
      if (rawTranscriptItems.length > 0) break;
      const lang = fallbackLangs[i];
      try {
        const libTranscript = await YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : undefined);
        if (Array.isArray(libTranscript) && libTranscript.length > 0) {
          rawTranscriptItems = libTranscript.map((item) => ({
            text: decodeHtmlEntities(item.text),
            startSeconds: Math.floor(item.offset / 1000),
            durationSeconds: Math.max(1, Math.floor(item.duration / 1000)),
          }));
          break;
        }
      } catch (libErr: any) {
        console.warn(`youtube-transcript package could not load captions (lang: ${lang || 'default'}) for video ${videoId}:`, libErr?.message || libErr);
        // Small delay before retrying with next language
        await new Promise((res) => setTimeout(res, 600));
      }
    }
  }

  // Strategy 3: oEmbed / noembed metadata fallback if title or author is still missing
  if (!title || !authorName) {
    const targetUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : videoIdOrUrl;
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (oembedRes.ok) {
        const data: any = await oembedRes.json();
        if (data.title && !title) title = decodeHtmlEntities(data.title);
        if (data.author_name && !authorName) authorName = decodeHtmlEntities(data.author_name);
        if (data.thumbnail_url && !thumbnailUrl) thumbnailUrl = data.thumbnail_url;
      }
    } catch {
      // Ignore
    }
  }

  if (!title) {
    if (videoIdOrUrl.length < 120 && !videoIdOrUrl.startsWith('http')) {
      title = videoIdOrUrl.trim();
    } else if (videoId) {
      title = `YouTube Video (${videoId})`;
    } else {
      title = 'Imported Video';
    }
  }

  // Group raw transcript items into meaningful 60-150 second instructional timeline chunks
  const transcriptSegments: TranscriptSegment[] = [];
  const hasTranscript = rawTranscriptItems.length > 0;
  let fullTranscriptText = '';

  if (hasTranscript) {
    // Sort chronologically
    rawTranscriptItems.sort((a, b) => a.startSeconds - b.startSeconds);
    fullTranscriptText = rawTranscriptItems.map((i) => i.text).join(' ');

    const CHUNK_DURATION = 90; // ~90s window per segment
    let currentChunkStart = rawTranscriptItems[0].startSeconds;
    let currentChunkEnd = currentChunkStart + CHUNK_DURATION;
    let currentTexts: string[] = [];
    let segIdx = 1;

    for (let i = 0; i < rawTranscriptItems.length; i++) {
      const item = rawTranscriptItems[i];
      currentTexts.push(item.text);

      const isLast = i === rawTranscriptItems.length - 1;
      if (item.startSeconds + item.durationSeconds >= currentChunkEnd || isLast) {
        transcriptSegments.push({
          segmentId: `seg_${segIdx}`,
          startSeconds: currentChunkStart,
          endSeconds: Math.max(
            currentChunkStart + 20,
            item.startSeconds + item.durationSeconds
          ),
          transcriptText: currentTexts.join(' '),
        });
        segIdx++;
        if (!isLast) {
          currentChunkStart = rawTranscriptItems[i + 1].startSeconds;
          currentChunkEnd = currentChunkStart + CHUNK_DURATION;
          currentTexts = [];
        }
      }
    }
  }

  return {
    videoId: videoId || 'eOrNzy3557o',
    title,
    authorName: authorName || 'Content Creator',
    description,
    durationSeconds: durationSeconds || 720,
    thumbnailUrl,
    hasTranscript,
    transcriptItems: rawTranscriptItems,
    transcriptSegments,
    fullTranscriptText,
  };
}

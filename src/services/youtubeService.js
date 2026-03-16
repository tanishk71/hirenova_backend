const fetch = require('node-fetch');

/**
 * Search YouTube for educational videos
 * @param {string} query - search term
 * @param {number} maxResults - max videos to return
 * @returns {Promise<Array>} array of course objects
 */
async function searchYouTubeVideos(query, maxResults = 10) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YouTube API key missing');
    return [];
  }

  // Use videoCategoryId=27 (Education) to focus on learning content
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&videoCategoryId=27&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('YouTube API error:', data.error);
      return [];
    }

    return data.items.map(item => ({
      externalId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      level: 'Beginner', // YouTube doesn't provide level; default to Beginner
      duration: 60, // placeholder – you could use another API to get actual duration
      topics: [],
      skills: [],
      externalUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high.url,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      source: 'YouTube',
      category: 'Technical', // can be refined later
      isPublished: true
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

module.exports = { searchYouTubeVideos };
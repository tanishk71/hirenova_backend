const axios = require('axios');

/**
 * Search api.video for videos
 * @param {string} query - search term
 * @param {number} maxResults - max results
 * @returns {Promise<Array>} array of course objects
 */
async function searchApiVideo(query, maxResults = 10) {
  const apiKey = process.env.APIVIDEO_API_KEY;
  if (!apiKey) {
    console.warn('api.video API key missing');
    return [];
  }

  try {
    // api.video search endpoint (from their docs)
    const response = await axios.get('https://ws.api.video/videos', {
      params: {
        currentPage: 1,
        pageSize: maxResults,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
        // They might support search through title/description via tags or metadata
        // We'll assume they have a search query parameter; adjust as needed
      },
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    // Filter results manually if search not supported
    let videos = response.data.data || [];
    if (query) {
      const lowerQuery = query.toLowerCase();
      videos = videos.filter(v => 
        v.title?.toLowerCase().includes(lowerQuery) ||
        v.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return videos.map(video => ({
      externalId: video.videoId,
      title: video.title,
      description: video.description || '',
      level: 'Beginner',
      duration: video.duration, // in seconds? check API
      topics: [],
      skills: [],
      externalUrl: video.assets?.player,
      embedUrl: video.assets?.iframe,
      thumbnail: video.assets?.thumbnail,
      source: 'api.video',
      category: 'Technical',
      isPublished: true
    }));
  } catch (error) {
    console.error('api.video API error:', error.response?.data || error.message);
    return [];
  }
}

module.exports = { searchApiVideo };
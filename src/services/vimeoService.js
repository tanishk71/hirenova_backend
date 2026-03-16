const axios = require('axios');

/**
 * Search Vimeo for videos matching query
 * @param {string} query - search term
 * @param {number} maxResults - max videos to return
 * @returns {Promise<Array>} array of course objects
 */
async function searchVimeoVideos(query, maxResults = 10) {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    console.warn('Vimeo access token missing');
    return [];
  }

  try {
    const response = await axios.get('https://api.vimeo.com/videos', {
      params: {
        query: query,
        per_page: maxResults,
        fields: 'uri,name,description,duration,link,pictures.sizes,privacy,user.name'
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.data.data.map(video => ({
      externalId: video.uri.split('/').pop(),
      title: video.name,
      description: video.description || `A Vimeo video about ${query}`,
      level: 'Beginner', // Vimeo doesn't provide level
      duration: video.duration, // in seconds – your schema expects minutes? Convert if needed
      topics: [],
      skills: [],
      externalUrl: video.link,
      embedUrl: `https://player.vimeo.com/video/${video.uri.split('/').pop()}`,
      thumbnail: video.pictures?.sizes?.pop()?.link,
      source: 'Vimeo',
      category: 'Technical', // could be refined later
      isPublished: true
    }));
  } catch (error) {
    console.error('Vimeo API error:', error.response?.data || error.message);
    return [];
  }
}

module.exports = { searchVimeoVideos };
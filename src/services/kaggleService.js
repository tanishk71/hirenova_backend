// src/services/kaggleService.js
const axios = require('axios');

/**
 * Extract string tags from Kaggle tag objects
 */
function extractTagNames(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => tag.name || tag.ref).filter(Boolean);
}

/**
 * Search Kaggle competitions
 */
async function searchKaggleCompetitions(query = '', maxResults = 10) {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;

  if (!username || !key) {
    console.warn('Kaggle credentials not set in environment');
    return [];
  }

  try {
    const response = await axios.get('https://www.kaggle.com/api/v1/competitions/list', {
      params: { search: query },
      auth: { username, password: key }
    });

    const competitions = response.data.slice(0, maxResults);

    return competitions.map(comp => ({
      externalId: comp.ref,
      title: comp.title,
      description: comp.description || comp.title,
      level: 'Intermediate',
      duration: comp.totalTimeMs ? Math.floor(comp.totalTimeMs / 60000) : 120,
      topics: extractTagNames(comp.tags),
      skills: extractTagNames(comp.tags),
      externalUrl: `https://www.kaggle.com/c/${comp.ref}`,
      thumbnail: comp.thumbnailUrl || null,
      source: 'Kaggle',
      category: 'Technical',
      isPublished: true
    }));
  } catch (error) {
    console.error('Error fetching Kaggle competitions:', error.message);
    return [];
  }
}

/**
 * Search Kaggle datasets
 */
async function searchKaggleDatasets(query = '', maxResults = 10) {
  const username = process.env.KAGGLE_USERNAME;
  const key = process.env.KAGGLE_KEY;

  if (!username || !key) {
    console.warn('Kaggle credentials not set in environment');
    return [];
  }

  try {
    const response = await axios.get('https://www.kaggle.com/api/v1/datasets/list', {
      params: { search: query },
      auth: { username, password: key }
    });

    const datasets = response.data.slice(0, maxResults);

    return datasets.map(ds => ({
      externalId: ds.ref,
      title: ds.title,
      description: ds.description || ds.title,
      level: 'Beginner',
      duration: 60,
      topics: extractTagNames(ds.tags),
      skills: extractTagNames(ds.tags),
      externalUrl: ds.url,
      thumbnail: ds.thumbnailUrl || null,
      source: 'Kaggle',
      category: 'Technical',
      isPublished: true
    }));
  } catch (error) {
    console.error('Error fetching Kaggle datasets:', error.message);
    return [];
  }
}

module.exports = { searchKaggleCompetitions, searchKaggleDatasets };
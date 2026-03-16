const { searchYouTubeVideos } = require('../services/youtubeService');
const { searchKaggleCompetitions, searchKaggleDatasets } = require('../services/kaggleService');
const { searchVimeoVideos } = require('../services/vimeoService');
// const { searchBoclipsVideos } = require('../services/boclipsService');
const { searchApiVideo } = require('../services/apiVideoService');
const Course = require('../models/Course');

exports.searchCourses = async (req, res) => {
  const { q, source, limit = 10 } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Search query (q) is required' });
  }

  try {
    let results = [];

    // 1. Database courses
    const dbQuery = {
      isPublished: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };
    if (source && source !== 'all') {
      dbQuery.source = source;
    }
    const dbCourses = await Course.find(dbQuery).limit(parseInt(limit));
    results.push(...dbCourses.map(c => c.toObject()));

    // 2. External sources
    const sourceLower = source ? source.toLowerCase() : 'all';
    const includeYouTube = sourceLower === 'all' || sourceLower === 'youtube';
    const includeKaggle = sourceLower === 'all' || sourceLower === 'kaggle';
    const includeVimeo = sourceLower === 'all' || sourceLower === 'vimeo';
    // const includeBoclips = sourceLower === 'all' || sourceLower === 'boclips';
    const includeApiVideo = sourceLower === 'all' || sourceLower === 'apivideo';

    const externalPromises = [];
    if (includeYouTube) externalPromises.push(searchYouTubeVideos(q, parseInt(limit)));
    if (includeKaggle) {
      externalPromises.push(
        searchKaggleCompetitions(q, parseInt(limit)),
        searchKaggleDatasets(q, parseInt(limit))
      );
    }
    if (includeVimeo) externalPromises.push(searchVimeoVideos(q, parseInt(limit)));
    // if (includeBoclips) externalPromises.push(searchBoclipsVideos(q, parseInt(limit)));
    if (includeApiVideo) externalPromises.push(searchApiVideo(q, parseInt(limit)));

    const externalResults = await Promise.allSettled(externalPromises);
    externalResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      } else {
        console.warn('External source failed:', result.reason);
      }
    });

    res.json({
      total: results.length,
      courses: results
    });
  } catch (error) {
    console.error('Course search error:', error);
    res.status(500).json({ message: 'Course search failed', error: error.message });
  }
};
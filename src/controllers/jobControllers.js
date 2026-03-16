const fetchFromAdzuna = require('../services/adzunaServices');
const fetchFromJSearch = require('../services/jsearchServices');

exports.searchJobs = async (req, res) => {
  const { query, type, location } = req.query;

  try {
    let jobs = [];

    // Internship & local jobs → Adzuna only
    if (type === 'internship') {
      jobs = await fetchFromAdzuna(query, location);
    }

    // Remote jobs → global
    else if (type === 'remote') {
      const adzunaJobs = await fetchFromAdzuna(query, location);
      const jsearchJobs = await fetchFromJSearch(query);
      jobs = [...adzunaJobs, ...jsearchJobs];
    }

    // Default full-time
    else {
      jobs = await fetchFromAdzuna(query, location);
    }

    res.json({
      total: jobs.length,
      jobs,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Job search failed',
      error: error.message,
    });
  }
};

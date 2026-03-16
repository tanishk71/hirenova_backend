const axios = require('axios');

const fetchFromAdzuna = async (query, location = 'India') => {
  try {
    const response = await axios.get(
      'https://api.adzuna.com/v1/api/jobs/in/search/1',
      {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          what: query,
          where: location,
          results_per_page: 20,
        },
      }
    );

    return response.data.results.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || 'India',
      description: job.description,
      applyLink: job.redirect_url,
      postedAt: job.created,
      source: 'adzuna',
      type: job.contract_time || 'full-time',
    }));
  } catch (error) {
    console.error('Adzuna API error:', error.response?.data || error.message);
    return []; // Return empty array so the job search continues with other sources
  }
};

module.exports = fetchFromAdzuna;

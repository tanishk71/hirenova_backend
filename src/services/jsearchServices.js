const axios = require('axios');

const fetchFromJSearch = async (query) => {
  try{
    const response = await axios.get(
      'https://jsearch.p.rapidapi.com/search',
      {
        params: {
          query,
          page: 1,
          num_pages: 1,
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
        },
      }
    );

    return response.data.data.map(job => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_location,
      description: job.job_description,
      applyLink: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc,
      source: 'jsearch',
      type: job.job_employment_type || 'full-time',
    }));
  } catch (error) {
    console.error('JSearch API error:', error.response?.data || error.message);
    return [];
  }
};

module.exports = fetchFromJSearch;

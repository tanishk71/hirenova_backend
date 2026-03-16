const axios = require('axios');

async function searchGoogleJobs(query, location = 'India', limit = 5) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn('SERPAPI_KEY missing');
    return [];
  }

  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_jobs',
        q: query,
        location: location,
        api_key: apiKey,
        num: limit,
      },
    });

    const jobs = response.data.jobs_results || [];
    return jobs.map(job => ({
      id: job.job_id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      description: job.description,
      applyLink: job.related_links?.apply_link || job.share_link,
      postedAt: job.detected_extensions?.posted_at,
      type: job.detected_extensions?.schedule_type || 'Full-time',
      salary: job.detected_extensions?.salary,
      logo: job.company_logo,
    }));
  } catch (error) {
    console.error('SerpApi error:', error.response?.data || error.message);
    return [];
  }
}

module.exports = { searchGoogleJobs };
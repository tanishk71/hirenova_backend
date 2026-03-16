const normalizeJSearchJob = (job) => ({
  id: job.job_id,
  title: job.job_title,
  company: job.employer_name,
  location: job.job_city || job.job_country || 'Unknown',
  description: job.job_description || '',
  applyLink: job.job_apply_link,
  postedAt: job.job_posted_at_datetime_utc || null,
  source: 'jsearch',
});

const normalizeAdzunaJob = (job) => ({
  id: job.id,
  title: job.title,
  company: job.company?.display_name || 'Unknown',
  location: job.location?.display_name || 'Unknown',
  description: job.description || '',
  applyLink: job.redirect_url,
  postedAt: job.created || null,
  source: 'adzuna',
});

module.exports = {
  normalizeJSearchJob,
  normalizeAdzunaJob,
};

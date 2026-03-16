const clean = (text = '') =>
  text.toLowerCase().replace(/[^a-z\s]/g, '');

const matchJobType = (job, type) => {
  const title = clean(job.title);
  const desc = clean(job.description);
  const loc = clean(job.location);

  switch (type.toLowerCase()) {
    case 'remote':
      return desc.includes('remote') || desc.includes('work from home') || loc.includes('remote');

    case 'internship':
      return title.includes('intern') || desc.includes('intern');

    case 'fulltime':
    case 'full-time':
      return desc.includes('full time') || desc.includes('full-time');

    case 'parttime':
    case 'part-time':
      return desc.includes('part time') || desc.includes('part-time');

    default:
      return true;
  }
};

module.exports = { matchJobType };

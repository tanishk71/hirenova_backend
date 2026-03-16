const fetch = require('node-fetch');

/**
 * Fetch all modules from Microsoft Learn catalog
 * @returns {Promise<Array>} array of course objects
 */
async function fetchMicrosoftCourses() {
  try {
    const response = await fetch('https://learn.microsoft.com/api/catalog/');
    const data = await response.json();

    // Transform to match your Course model
    return data.modules.map(module => ({
      externalId: module.uid,
      title: module.title,
      description: module.summary,
      category: mapCategory(module),          // ← new mapping
      level: mapLevel(module.level),
      duration: module.durationInMinutes || 60,
      topics: module.topics || [],
      skills: module.skills || [],
      // Ensure externalUrl is absolute
      externalUrl: module.url.startsWith('http') 
        ? module.url 
        : `https://learn.microsoft.com${module.url}`,
      thumbnail: module.imageUrl,
      source: 'microsoft-learn',
      isPublished: true
    }));
  } catch (error) {
    console.error('Error fetching Microsoft Learn courses:', error);
    return [];
  }
}

/**
 * Map Microsoft's level string to your enum
 */
function mapLevel(msLevel) {
  const level = msLevel?.toLowerCase() || '';
  if (level.includes('beginner')) return 'Beginner';
  if (level.includes('intermediate')) return 'Intermediate';
  if (level.includes('advanced')) return 'Advanced';
  return 'Beginner'; // default
}

/**
 * Map a module to a category based on its products or title/summary keywords
 */
function mapCategory(module) {
  // If the module has products, use the first one to infer category
  if (module.products && module.products.length > 0) {
    const product = module.products[0].toLowerCase();
    if (product.includes('azure') || product.includes('power') || product.includes('dynamics')) {
      return 'Technical';
    }
    // Add more product mappings as needed
  }

  // Fallback: search keywords in title and summary
  const text = (module.title + ' ' + (module.summary || '')).toLowerCase();
  if (text.includes('soft skill') || text.includes('communication') || text.includes('leadership')) {
    return 'Soft Skills';
  }
  if (text.includes('interview')) return 'Interview Prep';
  if (text.includes('resume')) return 'Resume Writing';
  if (text.includes('career') || text.includes('job search')) return 'Career Development';

  // Default to Technical for most Microsoft content
  return 'Technical';
}

module.exports = { fetchMicrosoftCourses };
const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');

/**
 * Unified Open Educational Resources service
 * Combines OpenLibrary, Wikipedia, and arXiv
 */
const openEduService = {
  /**
   * Search OpenLibrary for books
   * @param {string} query
   * @param {number} limit
   */
  async searchOpenLibrary(query, limit = 5) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.docs.map(book => ({
      externalId: book.key,
      title: book.title,
      description: book.subtitle || book.title,
      level: 'Beginner',
      duration: 60,
      topics: book.subject?.slice(0,3) || [],
      skills: [],
      externalUrl: `https://openlibrary.org${book.key}`,
      thumbnail: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
      source: 'OpenLibrary',
      category: 'General Knowledge'
    }));
  },

  /**
   * Search Wikipedia for a summary
   * @param {string} query
   */
  async searchWikipedia(query) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.type === 'disambiguation' || !data.extract) return [];

    return [{
      externalId: data.pageid?.toString() || data.titles?.canonical,
      title: data.title,
      description: data.extract.substring(0, 500) + '…',
      level: 'Beginner',
      duration: 30,
      topics: [],
      skills: [],
      externalUrl: data.content_urls.desktop.page,
      thumbnail: data.thumbnail?.source,
      source: 'Wikipedia',
      category: 'General Knowledge'
    }];
  },

  /**
   * Search arXiv for research papers
   * @param {string} query
   * @param {number} limit
   */
  async searchArXiv(query, limit = 5) {
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=${limit}`;
    const res = await fetch(url);
    const xml = await res.text();
    const result = await parseStringPromise(xml);
    const entries = result.feed.entry || [];

    return entries.map(entry => ({
      externalId: entry.id[0],
      title: entry.title[0],
      description: entry.summary[0].substring(0, 500) + '…',
      level: 'Advanced',
      duration: 120,
      topics: entry.category?.map(c => c.$.term) || [],
      skills: [],
      externalUrl: entry.id[0],
      thumbnail: null,
      source: 'arXiv',
      category: 'Technical'
    }));
  },

  /**
   * Unified search across all three sources
   * @param {string} query
   * @param {Object} options
   */
  async searchAll(query, options = {}) {
    const [books, wiki, papers] = await Promise.allSettled([
      this.searchOpenLibrary(query, options.bookLimit || 5),
      this.searchWikipedia(query),
      this.searchArXiv(query, options.paperLimit || 5)
    ]);

    return [
      ...(books.status === 'fulfilled' ? books.value : []),
      ...(wiki.status === 'fulfilled' ? wiki.value : []),
      ...(papers.status === 'fulfilled' ? papers.value : [])
    ];
  }
};

module.exports = openEduService;
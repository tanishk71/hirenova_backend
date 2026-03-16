const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Course = require(path.join(__dirname, '..', 'src', 'models', 'Course'));

// Existing services
const { fetchMicrosoftCourses } = require(path.join(__dirname, '..', 'src', 'services', 'microsoftLearnService'));
// New services
const { searchYouTubeVideos } = require(path.join(__dirname, '..', 'src', 'services', 'youtubeService'));
// const { fetchCourseraFromApify } = require(path.join(__dirname, '..', 'src', 'services', 'courseraApifyService'));
const { searchKaggleCompetitions, searchKaggleDatasets } = require(path.join(__dirname, '..', 'src', 'services', 'kaggleService'));

async function syncAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    const allCourses = [];

    // 1. Microsoft Learn
    console.log('📥 Fetching Microsoft Learn...');
    const msCourses = await fetchMicrosoftCourses();
    allCourses.push(...msCourses);
    console.log(`✅ ${msCourses.length} courses`);

    // 2. YouTube
    console.log('📥 Fetching YouTube videos...');
    const youtubeCourses = await searchYouTubeVideos('programming', 20);
    allCourses.push(...youtubeCourses);
    console.log(`✅ ${youtubeCourses.length} videos`);

    // 3. Coursera via Apify
    // console.log('📥 Fetching Coursera courses...');
    // const courseraCourses = await fetchCourseraFromApify('python', 10);
    // allCourses.push(...courseraCourses);
    // console.log(`✅ ${courseraCourses.length} courses`);

    // 4. Kaggle (competitions + datasets)
    console.log('📥 Fetching Kaggle competitions...');
    const kaggleComps = await searchKaggleCompetitions('machine learning', 5);
    allCourses.push(...kaggleComps);
    console.log(`✅ ${kaggleComps.length} competitions`);

    console.log('📥 Fetching Kaggle datasets...');
    const kaggleDatasets = await searchKaggleDatasets('data science', 5);
    allCourses.push(...kaggleDatasets);
    console.log(`✅ ${kaggleDatasets.length} datasets`);

    // Upsert all into database
    for (const courseData of allCourses) {
      await Course.findOneAndUpdate(
        { externalId: courseData.externalId, source: courseData.source },
        { ...courseData, lastSynced: new Date() },
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Synced ${allCourses.length} total resources`);
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

syncAll();
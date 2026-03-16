const { generateCourseContent } = require('./src/services/aiCourseService');
require('dotenv').config();

async function test() {
  try {
    const course = await generateCourseContent('machine learning', 'Beginner');
    console.log('✅ Generated course:');
    console.log(JSON.stringify(course, null, 2));
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
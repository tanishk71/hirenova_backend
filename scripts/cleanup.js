const path = require('path');
const mongoose = require('mongoose');
// Load .env from the project root (one level up from scripts)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Correct paths to models (inside src/models)
const Course = require(path.join(__dirname, '..', 'src', 'models', 'Course'));
const UserProgress = require(path.join(__dirname, '..', 'src', 'models', 'UserProgress'));
const Certificate = require(path.join(__dirname, '..', 'src', 'models', 'Certificate'));

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    // Delete all courses
    const courseResult = await Course.deleteMany({});
    console.log(`🗑️ Deleted ${courseResult.deletedCount} courses`);

    // Delete all user progress
    const progressResult = await UserProgress.deleteMany({});
    console.log(`🗑️ Deleted ${progressResult.deletedCount} user progress records`);

    // Delete all certificates
    const certResult = await Certificate.deleteMany({});
    console.log(`🗑️ Deleted ${certResult.deletedCount} certificates`);

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

cleanup();
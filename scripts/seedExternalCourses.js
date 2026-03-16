const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Course = require(path.join(__dirname, '..', 'src', 'models', 'Course'));

const externalCourses = [
  {
    title: 'Introduction to Computer Science',
    description: 'MIT’s introductory course on computer science and programming in Python.',
    source: 'mit-ocw',
    level: 'Beginner',
    duration: 120,
    topics: ['Programming', 'Python'],
    skills: ['Python', 'Algorithms'],
    externalUrl: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
    thumbnail: 'https://ocw.mit.edu/courses/6-0001/6-0001f16.jpg',
    category: 'Technical',
    isPublished: true,
    externalId: 'mit-6.0001'
  },
  {
    title: 'Machine Learning',
    description: 'Stanford’s machine learning course on Coursera (taught by Andrew Ng).',
    source: 'coursera',
    level: 'Intermediate',
    duration: 600,
    topics: ['Machine Learning', 'AI'],
    skills: ['Machine Learning', 'Python'],
    externalUrl: 'https://www.coursera.org/learn/machine-learning',
    thumbnail: 'https://d3njjcbhbojbot.cloudfront.net/api/...',
    category: 'Technical',
    isPublished: true,
    externalId: 'coursera-ml'
  },
  {
    title: 'Introduction to Programming in C',
    description: 'NPTEL course on C programming by IIT Kanpur.',
    source: 'nptel',
    level: 'Beginner',
    duration: 240,
    topics: ['C Programming'],
    skills: ['C'],
    externalUrl: 'https://nptel.ac.in/courses/106104128',
    thumbnail: 'https://nptel.ac.in/courses/106104128/...',
    category: 'Technical',
    isPublished: true,
    externalId: 'nptel-c'
  }
  // Add more as needed
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    for (const course of externalCourses) {
      const result = await Course.findOneAndUpdate(
        { externalId: course.externalId, source: course.source },
        course,
        { upsert: true, new: true }
      );
      console.log(`Upserted: ${course.title} (${result._id})`);
    }

    console.log('✅ Seeding complete');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
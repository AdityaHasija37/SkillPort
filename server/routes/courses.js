const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'username');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new course (only for instructors)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create courses' });
    }
    const course = new Course({ ...req.body, instructor: req.user.userId });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a specific course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'username');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll in a course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (course.enrolledStudents.includes(req.user.userId)) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    course.enrolledStudents.push(req.user.userId);
    await course.save();
    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course progress
router.post('/:id/progress', auth, async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      const studentIndex = course.enrolledStudents.findIndex(
        student => student.user.toString() === req.user.userId
      );
  
      if (studentIndex === -1) {
        return res.status(400).json({ error: 'User not enrolled in this course' });
      }
  
      course.enrolledStudents[studentIndex].progress = req.body.progress;
      course.enrolledStudents[studentIndex].lastAccessed = Date.now();
  
      await course.save();
      res.json({ message: 'Progress updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get courses for the logged-in instructor
router.get('/instructor', auth, async (req, res) => {
    try {
      const courses = await Course.find({ instructor: req.user.userId })
        .populate('enrolledStudents.user', 'username email');
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const { search, category, level, minPrice, maxPrice } = req.query;
      let query = {};
  
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
  
      if (category) {
        query.category = category;
      }
  
      if (level) {
        query.level = level;
      }
  
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
  
      const courses = await Course.find(query).populate('instructor', 'username');
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id/certificate', auth, async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      const student = course.enrolledStudents.find(
        student => student.user.toString() === req.user.userId
      );
  
      if (!student || student.progress < 100) {
        return res.status(400).json({ error: 'Course not completed' });
      }
  
      const user = await User.findById(req.user.userId);
  
      // Create a PDF document
      const doc = new PDFDocument();
      const filename = `certificate-${course._id}-${req.user.userId}.pdf`;
  
      res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
      res.setHeader('Content-type', 'application/pdf');
  
      doc.pipe(res);
  
      // Add content to the PDF
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .text('Certificate of Completion', 100, 100);
  
      doc.font('Helvetica')
         .fontSize(16)
         .text(`This is to certify that ${user.username} has successfully completed the course`, 100, 150)
         .text(`"${course.title}"`, 100, 180);
  
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .text('Congratulations!', 100, 250);
  
      doc.end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
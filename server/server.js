const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

// Import routes
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('SkillPort API is running');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Marks Controller
const Marks = require('../models/marksModel');
const User = require('../models/userModel');

const marksController = {
  getMarks: async (req, res) => {
    try {
      const { studentId, subject, category, subCategory, teacherId } = req.query;

      const query = {};
      if (studentId) query.studentId = studentId;
      if (subject) query.subject = subject;
      if (category) query.category = category;
      if (subCategory) query.subCategory = subCategory;
      if (teacherId) query.teacherId = teacherId;

      const marks = await Marks.find(query)
        .populate('studentId', 'name email class section usn')
        .populate('teacherId', 'name email');

      res.json(marks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
  },

  addMarks: async (req, res) => {
    try {
      const { studentId, subject, marks, teacherId, category, subCategory, status } = req.body;

      const newMarks = new Marks({
        studentId,
        subject,
        marks,
        teacherId,
        category,
        subCategory,
        status: status || 'completed',
      });

      await newMarks.save();
      res.status(201).json({ message: 'Marks added successfully', data: newMarks });
    } catch (error) {
      res.status(500).json({ message: 'Error adding marks', error: error.message });
    }
  },

  updateMarks: async (req, res) => {
    try {
      const { id } = req.params;
      const { marks, subCategory } = req.body;

      const updatedMarks = await Marks.findByIdAndUpdate(
        id,
        { marks, ...(subCategory ? { subCategory } : {}), updatedAt: Date.now() },
        { new: true }
      );

      res.json({ message: 'Marks updated successfully', data: updatedMarks });
    } catch (error) {
      res.status(500).json({ message: 'Error updating marks', error: error.message });
    }
  },

  deleteMarks: async (req, res) => {
    try {
      const { id } = req.params;
      await Marks.findByIdAndDelete(id);
      res.json({ message: 'Marks deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting marks', error: error.message });
    }
  },

  // GET /api/marks/by-usn?usn=CS20B001
  byUsn: async (req, res) => {
    try {
      const { usn } = req.query;
      if (!usn) return res.status(400).json({ message: 'usn is required' });

      const student = await User.findOne({ usn, role: 'student' }).select('_id name email class section usn');
      if (!student) return res.status(404).json({ message: 'Student not found for given USN' });

      const marks = await Marks.find({ studentId: student._id })
        .populate('studentId', 'name email class section usn')
        .populate('teacherId', 'name email');

      return res.json({ student, marks });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching marks by USN', error: error.message });
    }
  },

  // Dashboard summary for teacher
  teacherSummary: async (req, res) => {
    try {
      const { teacherId } = req.query;

      const totalStudents = await User.countDocuments({ role: 'student' });

      const classes = await User.distinct('class', { role: 'student' });
      const classesManaged = classes.filter(Boolean).length;

      const pendingEvaluations = await Marks.countDocuments({
        teacherId,
        status: 'pending',
      });

      res.json({ totalStudents, classesManaged, pendingEvaluations });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching summary', error: error.message });
    }
  },

  // GET /api/marks/students?department=...&class=...&section=...&year=...
  studentsByFilter: async (req, res) => {
    try {
      const { department, class: className, section, year } = req.query;
      const filter = { role: 'student' };
      if (department) filter.department = department;
      if (className) filter.class = className;
      if (section) filter.section = section;
      if (year) filter.year = year;

      const students = await User.find(filter)
        .select('_id name usn department class section year')
        .sort({ usn: 1, name: 1 });

      return res.json({ students });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
  },
};

module.exports = marksController;

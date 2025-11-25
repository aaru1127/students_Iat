// const express = require("express");
// const marksController = require("../controllers/marksController");
// const authMiddleware = require("../middleware/authMiddleware");

// const router = express.Router();

// // All marks endpoints require authentication
// router.get("/", authMiddleware, marksController.getMarks);
// router.post("/", authMiddleware, marksController.addMarks);
// router.put("/:id", authMiddleware, marksController.updateMarks);
// router.delete("/:id", authMiddleware, marksController.deleteMarks);

// module.exports = router;

const express = require("express");
const marksController = require("../controllers/marksController");

const router = express.Router();

// NO AUTH FOR NOW
router.get("/", marksController.getMarks);
router.get("/by-usn", marksController.byUsn);
router.get("/teacher-summary", marksController.teacherSummary);
router.get("/students", marksController.studentsByFilter);
router.post("/", marksController.addMarks);
router.put("/:id", marksController.updateMarks);
router.delete("/:id", marksController.deleteMarks);

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const sc = require('../controllers/scheduleController');

router.use(auth);

// Calendar monthly data
router.get('/calendar', sc.getCalendarData);

// Students next 5 upcoming schedule slots
router.get('/upcoming', sc.getUpcomingForStudent);

// Schedules CRUD
router.get('/', sc.getSchedules);
router.post('/', authorize('institution_owner', 'faculty', 'super_admin'), sc.scheduleExamToClass);
router.put('/:id', authorize('institution_owner', 'faculty', 'super_admin'), sc.updateSchedule);

module.exports = router;

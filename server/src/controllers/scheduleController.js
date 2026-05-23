const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ClassExamSchedule = require('../models/ClassExamSchedule');
const ClassBatch = require('../models/ClassBatch');
const Exam = require('../models/Exam');
const ExamShareLink = require('../models/ExamShareLink');

exports.scheduleExamToClass = async (req, res, next) => {
  try {
    const { 
      examId, 
      classId, 
      scheduledStart, 
      scheduledEnd, 
      timezone, 
      notes, 
      allowLateSubmission, 
      lateSubmissionWindow 
    } = req.body;

    // 1. Verify exam belongs to institution + is published
    const exam = await Exam.findOne({ _id: examId, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found');
    if (exam.status !== 'published') {
      throw ApiError.badRequest('Only published exams can be scheduled to classrooms');
    }

    // 2. Verify class belongs to institution
    const classroom = await ClassBatch.findOne({ _id: classId, institution: req.user.institution, isActive: true });
    if (!classroom) throw ApiError.notFound('Classroom not found');

    // Convert string inputs to Date objects
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (start >= end) {
      throw ApiError.badRequest('Scheduled start time must be before end time');
    }

    // 3. Check no overlapping active schedule for this class at this time
    const overlap = await ClassExamSchedule.findOne({
      class: classId,
      status: { $ne: 'cancelled' },
      $or: [
        { scheduledStart: { $lt: end }, scheduledEnd: { $gt: start } }
      ]
    });

    if (overlap) {
      throw ApiError.badRequest('There is already an exam scheduled for this classroom during this time period.');
    }

    // 4. Auto-create an ExamShareLink for this class
    const slug = crypto.randomBytes(4).toString('hex');
    const shareLink = await ExamShareLink.create({
      exam: examId,
      institution: req.user.institution,
      createdBy: req.user._id,
      slug,
      type: 'open',
      label: `${classroom.name} - ${exam.title}`,
      expiresAt: end,
      isActive: true
    });

    // 5. Create ClassExamSchedule
    const schedule = await ClassExamSchedule.create({
      class: classId,
      exam: examId,
      institution: req.user.institution,
      scheduledBy: req.user._id,
      shareLink: shareLink._id,
      scheduledStart: start,
      scheduledEnd: end,
      timezone: timezone || 'UTC',
      notes: notes || '',
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionWindow: lateSubmissionWindow || 0,
      status: 'scheduled'
    });

    // 6. Update exam.settings.scheduledStart and scheduledEnd if not already set
    let examModified = false;
    if (!exam.settings.scheduledStart || exam.settings.scheduledStart > start) {
      exam.settings.scheduledStart = start;
      examModified = true;
    }
    if (!exam.settings.scheduledEnd || exam.settings.scheduledEnd < end) {
      exam.settings.scheduledEnd = end;
      examModified = true;
    }
    if (examModified) {
      await exam.save();
    }

    const joinUrl = `${env.CLIENT_URL}/e/${slug}`;
    ApiResponse.created(res, { schedule, shareLink, joinUrl }, 'Exam scheduled to class successfully');
  } catch (error) { next(error); }
};

exports.getSchedules = async (req, res, next) => {
  try {
    const { classId, examId, status, from, to } = req.query;
    const query = { institution: req.user.institution };

    // Enforce role-based filters
    if (req.user.role === 'student') {
      const classes = await ClassBatch.find({ students: req.user._id, isActive: true });
      const classIds = classes.map(c => c._id);
      query.class = { $in: classIds };
    }

    if (classId) query.class = classId;
    if (examId) query.exam = examId;
    if (status) query.status = status;
    
    if (from || to) {
      query.scheduledStart = {};
      if (from) query.scheduledStart.$gte = new Date(from);
      if (to) query.scheduledStart.$lte = new Date(to);
    }

    const schedules = await ClassExamSchedule.find(query)
      .populate('exam', 'title subject settings.duration')
      .populate('class', 'name color coverEmoji')
      .populate('shareLink', 'slug')
      .sort('scheduledStart');

    ApiResponse.success(res, { schedules });
  } catch (error) { next(error); }
};

exports.getCalendarData = async (req, res, next) => {
  try {
    const { month } = req.query; // Expecting YYYY-MM
    if (!month) throw ApiError.badRequest('month query parameter (YYYY-MM) is required');

    const query = { institution: req.user.institution };

    if (req.user.role === 'student') {
      const classes = await ClassBatch.find({ students: req.user._id, isActive: true });
      const classIds = classes.map(c => c._id);
      query.class = { $in: classIds };
    }

    // Set search date ranges for full calendar month
    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    query.scheduledStart = { $gte: startOfMonth, $lte: endOfMonth };
    query.status = { $ne: 'cancelled' };

    const schedules = await ClassExamSchedule.find(query)
      .populate('exam', 'title')
      .populate('class', 'name color')
      .sort('scheduledStart');

    // Group schedules by local calendar date (YYYY-MM-DD format)
    const grouped = {};
    schedules.forEach(s => {
      const dateStr = s.scheduledStart.toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push({
        scheduleId: s._id,
        examTitle: s.exam?.title || 'Assessment',
        className: s.class?.name || 'Classroom',
        scheduledStart: s.scheduledStart,
        scheduledEnd: s.scheduledEnd,
        status: s.status,
        color: s.class?.color || '#0ea5e9'
      });
    });

    ApiResponse.success(res, grouped);
  } catch (error) { next(error); }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledStart, scheduledEnd, notes, allowLateSubmission, status } = req.body;

    const schedule = await ClassExamSchedule.findOne({ _id: id, institution: req.user.institution });
    if (!schedule) throw ApiError.notFound('Schedule not found');

    if (scheduledStart) schedule.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) schedule.scheduledEnd = new Date(scheduledEnd);
    if (notes !== undefined) schedule.notes = notes;
    if (allowLateSubmission !== undefined) schedule.allowLateSubmission = allowLateSubmission;
    
    if (status !== undefined) {
      schedule.status = status;
      if (status === 'cancelled') {
        // Deactivate active sharing link automatically
        if (schedule.shareLink) {
          await ExamShareLink.findByIdAndUpdate(schedule.shareLink, { isActive: false });
        }
      }
    }

    await schedule.save();
    ApiResponse.success(res, { schedule }, 'Schedule updated successfully');
  } catch (error) { next(error); }
};

exports.getUpcomingForStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      throw ApiError.forbidden('Only students can query their upcoming assessment timelines');
    }

    const classes = await ClassBatch.find({ students: req.user._id, isActive: true });
    const classIds = classes.map(c => c._id);

    const now = new Date();

    // Fetch next 5 active upcoming schedules
    const schedules = await ClassExamSchedule.find({
      class: { $in: classIds },
      scheduledEnd: { $gt: now },
      status: { $in: ['scheduled', 'live'] }
    })
      .populate('exam', 'title subject settings.duration description')
      .populate('class', 'name color coverEmoji')
      .populate('shareLink', 'slug')
      .sort('scheduledStart')
      .limit(5);

    const list = schedules.map(s => {
      const timeUntilStart = Math.max(0, Math.round((s.scheduledStart.getTime() - now.getTime()) / 1000));
      return {
        scheduleId: s._id,
        exam: s.exam,
        class: s.class,
        scheduledStart: s.scheduledStart,
        scheduledEnd: s.scheduledEnd,
        status: s.status,
        timeUntilStart,
        shareLinkSlug: s.shareLink?.slug || null
      };
    });

    ApiResponse.success(res, { upcoming: list });
  } catch (error) { next(error); }
};

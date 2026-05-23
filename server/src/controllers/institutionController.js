const Institution = require('../models/Institution');
const Department = require('../models/Department');
const ClassBatch = require('../models/ClassBatch');
const User = require('../models/User');
const UsageQuotaConfig = require('../models/UsageQuotaConfig');
const ClassExamSchedule = require('../models/ClassExamSchedule');
const ExamAttempt = require('../models/ExamAttempt');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateSlug, buildPagination } = require('../utils/helpers');
const crypto = require('crypto');
const env = require('../config/env');

// Helper to generate safe random alphanumeric strings
function generateInviteCodeSuffix(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

exports.getMyInstitution = async (req, res, next) => {
  try {
    const institution = await Institution.findById(req.user.institution).populate('owner', 'name email');
    if (!institution) throw ApiError.notFound('Institution not found');
    ApiResponse.success(res, { institution });
  } catch (error) { next(error); }
};

exports.updateInstitution = async (req, res, next) => {
  try {
    const { name, description, type, website, settings, address } = req.body;
    const institution = await Institution.findByIdAndUpdate(
      req.user.institution,
      { name, description, type, website, settings, address },
      { new: true, runValidators: true }
    );
    ApiResponse.success(res, { institution }, 'Institution updated');
  } catch (error) { next(error); }
};

// Departments
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ institution: req.user.institution, isActive: true })
      .populate('head', 'name email').sort('name');
    ApiResponse.success(res, { departments });
  } catch (error) { next(error); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create({
      ...req.body,
      institution: req.user.institution,
    });
    ApiResponse.created(res, { department });
  } catch (error) { next(error); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true }
    );
    if (!department) throw ApiError.notFound('Department not found');
    ApiResponse.success(res, { department }, 'Department updated');
  } catch (error) { next(error); }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    await Department.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isActive: false }
    );
    ApiResponse.success(res, null, 'Department deleted');
  } catch (error) { next(error); }
};

// Classes/Batches
exports.getClasses = async (req, res, next) => {
  try {
    const classes = await ClassBatch.find({ institution: req.user.institution, isActive: true })
      .populate('department', 'name')
      .populate('students', 'name email')
      .populate('faculty', 'name email')
      .sort('name');
    ApiResponse.success(res, { classes });
  } catch (error) { next(error); }
};

exports.createClass = async (req, res, next) => {
  try {
    const classBatch = await ClassBatch.create({
      ...req.body,
      institution: req.user.institution,
    });
    ApiResponse.created(res, { class: classBatch });
  } catch (error) { next(error); }
};

exports.updateClass = async (req, res, next) => {
  try {
    const classBatch = await ClassBatch.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true }
    );
    if (!classBatch) throw ApiError.notFound('Class not found');
    ApiResponse.success(res, { class: classBatch }, 'Class updated');
  } catch (error) { next(error); }
};

exports.deleteClass = async (req, res, next) => {
  try {
    await ClassBatch.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isActive: false }
    );
    ApiResponse.success(res, null, 'Class deleted');
  } catch (error) { next(error); }
};

// Members
exports.getMembers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = { institution: req.user.institution, isActive: true };
    if (role) query.role = role;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await User.countDocuments(query);
    const members = await User.find(query)
      .select('-password')
      .populate('department', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    ApiResponse.paginated(res, { members }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.addMember = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.badRequest('Email already registered');

    const user = await User.create({
      name, email, password,
      role: role || 'student',
      institution: req.user.institution,
      department: department || null,
    });

    ApiResponse.created(res, { member: user }, 'Member added');
  } catch (error) { next(error); }
};

exports.updateMember = async (req, res, next) => {
  try {
    const { name, role, department, isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { name, role, department, isActive },
      { new: true }
    ).select('-password');
    if (!user) throw ApiError.notFound('Member not found');
    ApiResponse.success(res, { member: user }, 'Member updated');
  } catch (error) { next(error); }
};

exports.removeMember = async (req, res, next) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isActive: false }
    );
    ApiResponse.success(res, null, 'Member removed');
  } catch (error) { next(error); }
};

// ==========================================
// NEW CLASSROOM OPERATIONS (PHASE 2.1)
// ==========================================

exports.getClassrooms = async (req, res, next) => {
  try {
    const { role } = req.user;
    const query = { institution: req.user.institution, isActive: true };

    if (role === 'student') {
      query.students = req.user._id;
    }

    const classrooms = await ClassBatch.find(query)
      .populate('department', 'name')
      .populate('faculty', 'name email')
      .populate('students', 'name email')
      .sort('-createdAt');

    const classroomsData = [];
    const now = new Date();

    for (const c of classrooms) {
      const cObj = c.toObject();
      
      if (role === 'student') {
        cObj.upcomingCount = await ClassExamSchedule.countDocuments({
          class: c._id,
          scheduledStart: { $gt: now },
          status: { $ne: 'cancelled' }
        });
      } else {
        cObj.scheduledCount = await ClassExamSchedule.countDocuments({
          class: c._id,
          status: { $ne: 'cancelled' }
        });
      }

      classroomsData.push(cObj);
    }

    ApiResponse.success(res, { classrooms: classroomsData });
  } catch (error) { next(error); }
};

exports.getClassroomDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classroom = await ClassBatch.findOne({ _id: id, institution: req.user.institution, isActive: true })
      .populate('department', 'name')
      .populate('students', 'name email lastActive createdAt')
      .populate('faculty', 'name email');

    if (!classroom) throw ApiError.notFound('Classroom not found');

    const isMember = classroom.faculty.some(f => f._id.toString() === req.user._id.toString()) ||
                     classroom.students.some(s => s._id.toString() === req.user._id.toString()) ||
                     req.user.role === 'institution_owner' ||
                     req.user.role === 'super_admin';

    if (!isMember) throw ApiError.forbidden('You are not authorized to view this classroom');

    const now = new Date();
    
    const upcomingSchedules = await ClassExamSchedule.find({
      class: id,
      scheduledStart: { $gt: now },
      status: { $ne: 'cancelled' }
    }).populate('exam', 'title subject settings.duration').sort('scheduledStart');

    const pastSchedules = await ClassExamSchedule.find({
      class: id,
      scheduledEnd: { $lte: now },
      status: { $ne: 'cancelled' }
    }).populate('exam', 'title subject settings.duration').sort('-scheduledEnd');

    const pastSchedulesData = [];
    for (const s of pastSchedules) {
      const sObj = s.toObject();
      sObj.attemptCount = await ExamAttempt.countDocuments({ exam: s.exam?._id, status: 'submitted' });
      pastSchedulesData.push(sObj);
    }

    const classroomData = classroom.toObject();
    classroomData.upcomingSchedules = upcomingSchedules;
    classroomData.pastSchedules = pastSchedulesData;
    // Announcements sorted by pinned first, then date descending
    classroomData.announcements = (classroom.pinnedAnnouncements || []).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    ApiResponse.success(res, { classroom: classroomData });
  } catch (error) { next(error); }
};

exports.createClassroom = async (req, res, next) => {
  try {
    const { name, description, subject, department, academicYear, semester, color, coverEmoji, maxStudents } = req.body;

    const inviteSlug = crypto.randomBytes(4).toString('hex'); // 8-char inviteLink slug
    const cleanSubject = (subject || 'CLASS').toUpperCase().replace(/\s/g, '');
    const inviteCode = `${cleanSubject}-${generateInviteCodeSuffix(4)}`;

    const classroom = await ClassBatch.create({
      name,
      description: description || '',
      subject: subject || '',
      department: department || null,
      academicYear: academicYear || new Date().getFullYear().toString(),
      semester: semester || '',
      color: color || '#0ea5e9',
      coverEmoji: coverEmoji || '📚',
      maxStudents: maxStudents || null,
      institution: req.user.institution,
      inviteCode,
      inviteLink: inviteSlug,
      faculty: [req.user._id],
      students: []
    });

    const fullJoinUrl = `${env.CLIENT_URL}/join-class/${inviteSlug}`;
    ApiResponse.created(res, { classroom, fullJoinUrl }, 'Classroom created successfully');
  } catch (error) { next(error); }
};

exports.updateClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, subject, semester, color, coverEmoji, maxStudents, isActive } = req.body;

    const classroom = await ClassBatch.findOne({ _id: id, institution: req.user.institution });
    if (!classroom) throw ApiError.notFound('Classroom not found');

    if (name !== undefined) classroom.name = name;
    if (description !== undefined) classroom.description = description;
    if (subject !== undefined) classroom.subject = subject;
    if (semester !== undefined) classroom.semester = semester;
    if (color !== undefined) classroom.color = color;
    if (coverEmoji !== undefined) classroom.coverEmoji = coverEmoji;
    if (maxStudents !== undefined) classroom.maxStudents = maxStudents;
    if (isActive !== undefined) classroom.isActive = isActive;

    await classroom.save();
    ApiResponse.success(res, { classroom }, 'Classroom updated successfully');
  } catch (error) { next(error); }
};

exports.joinClassroomByCode = async (req, res, next) => {
  try {
    const { inviteCode, inviteLink } = req.body;
    
    let query = { institution: req.user.institution, isActive: true };
    if (inviteCode) {
      query.inviteCode = inviteCode;
    } else if (inviteLink) {
      query.inviteLink = inviteLink;
    } else {
      throw ApiError.badRequest('inviteCode or inviteLink parameter is required');
    }

    const classroom = await ClassBatch.findOne(query);
    if (!classroom) throw ApiError.notFound('Classroom not found matching parameters');

    if (classroom.inviteCodeExpiresAt && classroom.inviteCodeExpiresAt < new Date()) {
      throw ApiError.badRequest('Classroom invitation code has expired');
    }

    if (classroom.maxStudents && classroom.students.length >= classroom.maxStudents) {
      throw ApiError.badRequest('Classroom has reached maximum student capacity');
    }

    const alreadyEnrolled = classroom.students.some(s => s.toString() === req.user._id.toString());
    if (alreadyEnrolled) {
      return ApiResponse.success(res, { classroom }, 'You are already joined in this classroom');
    }

    classroom.students.push(req.user._id);
    await classroom.save();

    ApiResponse.success(res, { classroom }, 'Successfully joined classroom');
  } catch (error) { next(error); }
};

exports.resolveClassroomInvite = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const classroom = await ClassBatch.findOne({ inviteLink: slug, isActive: true })
      .populate('institution', 'name');

    if (!classroom) throw ApiError.notFound('Classroom invitation link not found');

    ApiResponse.success(res, {
      name: classroom.name,
      description: classroom.description,
      subject: classroom.subject,
      coverEmoji: classroom.coverEmoji,
      color: classroom.color,
      facultyCount: classroom.faculty.length,
      studentCount: classroom.students.length,
      institution: {
        name: classroom.institution?.name || 'Quizify partner'
      }
    });
  } catch (error) { next(error); }
};

exports.addAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, isPinned } = req.body;

    const classroom = await ClassBatch.findOne({ _id: id, institution: req.user.institution });
    if (!classroom) throw ApiError.notFound('Classroom not found');

    classroom.pinnedAnnouncements.push({
      text,
      isPinned: isPinned || false,
      createdBy: req.user._id,
      createdAt: new Date()
    });

    await classroom.save();
    ApiResponse.success(res, { classroom }, 'Announcement posted successfully');
  } catch (error) { next(error); }
};

exports.removeStudentFromClass = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;

    const classroom = await ClassBatch.findOne({ _id: id, institution: req.user.institution });
    if (!classroom) throw ApiError.notFound('Classroom not found');

    classroom.students = classroom.students.filter(s => s.toString() !== studentId);
    await classroom.save();

    ApiResponse.success(res, null, 'Student removed from classroom successfully');
  } catch (error) { next(error); }
};

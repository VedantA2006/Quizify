const Institution = require('../models/Institution');
const Department = require('../models/Department');
const ClassBatch = require('../models/ClassBatch');
const User = require('../models/User');
const UsageQuotaConfig = require('../models/UsageQuotaConfig');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateSlug, buildPagination } = require('../utils/helpers');

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

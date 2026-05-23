const ResourceFile = require('../models/ResourceFile');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { buildPagination } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

exports.getResources = async (req, res, next) => {
  try {
    const { tag, subject, folder, search, page = 1, limit = 20 } = req.query;
    const query = { institution: req.user.institution, isActive: true };
    if (tag) query.tags = tag;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (folder) query.folder = folder;
    if (search) query.originalName = { $regex: search, $options: 'i' };

    const total = await ResourceFile.countDocuments(query);
    const resources = await ResourceFile.find(query)
      .populate('uploadedBy', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    ApiResponse.paginated(res, { resources }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.getResource = async (req, res, next) => {
  try {
    const resource = await ResourceFile.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    }).populate('uploadedBy', 'name email');
    if (!resource) throw ApiError.notFound('Resource not found');
    ApiResponse.success(res, { resource });
  } catch (error) { next(error); }
};

exports.uploadResource = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No file uploaded');

    const resource = await ResourceFile.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      institution: req.user.institution,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      subject: req.body.subject || '',
      description: req.body.description || '',
      folder: req.body.folder || 'general',
      useForAi: req.body.useForAi !== 'false',
    });

    ApiResponse.created(res, { resource }, 'Resource uploaded');
  } catch (error) { next(error); }
};

exports.updateResource = async (req, res, next) => {
  try {
    const resource = await ResourceFile.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true }
    );
    if (!resource) throw ApiError.notFound('Resource not found');
    ApiResponse.success(res, { resource }, 'Resource updated');
  } catch (error) { next(error); }
};

exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await ResourceFile.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isActive: false }
    );
    ApiResponse.success(res, null, 'Resource deleted');
  } catch (error) { next(error); }
};

exports.downloadResource = async (req, res, next) => {
  try {
    const resource = await ResourceFile.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    });
    if (!resource) throw ApiError.notFound('Resource not found');

    const filePath = path.resolve(resource.path);
    if (!fs.existsSync(filePath)) throw ApiError.notFound('File not found on disk');

    res.download(filePath, resource.originalName);
  } catch (error) { next(error); }
};

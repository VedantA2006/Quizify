const Exam = require('../models/Exam');
const QuestionBankItem = require('../models/QuestionBankItem');
const StudentExamAccess = require('../models/StudentExamAccess');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { buildPagination, generateCode } = require('../utils/helpers');
const AiGenerationLog = require('../models/AiGenerationLog');

exports.getExams = async (req, res, next) => {
  try {
    const { status, subject, search, page = 1, limit = 20 } = req.query;
    const query = { institution: req.user.institution, isActive: true };
    if (status) query.status = status;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query)
      .populate('createdBy', 'name')
      .select('-sections.questions')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    ApiResponse.paginated(res, { exams }, buildPagination(total, page, limit));
  } catch (error) { next(error); }
};

exports.getExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('sections.questions.question');
    if (!exam) throw ApiError.notFound('Exam not found');
    ApiResponse.success(res, { exam });
  } catch (error) { next(error); }
};

exports.createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      institution: req.user.institution,
      createdBy: req.user._id,
    });
    ApiResponse.created(res, { exam });
  } catch (error) { next(error); }
};

exports.updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    });
    if (!exam) throw ApiError.notFound('Exam not found');

    if (exam.status === 'published') {
      throw ApiError.badRequest('Cannot edit a published exam');
    }

    // Save version
    exam.versions.push({
      title: exam.title,
      sections: exam.sections,
      settings: exam.settings,
      updatedBy: req.user._id,
    });

    Object.assign(exam, req.body);
    await exam.save();

    ApiResponse.success(res, { exam }, 'Exam updated');
  } catch (error) { next(error); }
};

exports.deleteExam = async (req, res, next) => {
  try {
    await Exam.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isActive: false }
    );
    ApiResponse.success(res, null, 'Exam deleted');
  } catch (error) { next(error); }
};

exports.addSection = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found');

    exam.sections.push({
      title: req.body.title || `Section ${exam.sections.length + 1}`,
      instructions: req.body.instructions || '',
      order: exam.sections.length,
      questions: [],
    });
    await exam.save();

    ApiResponse.success(res, { exam }, 'Section added');
  } catch (error) { next(error); }
};

exports.addQuestionsToSection = async (req, res, next) => {
  try {
    const { sectionIndex, questionIds } = req.body;
    const exam = await Exam.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found');
    if (!exam.sections[sectionIndex]) throw ApiError.badRequest('Invalid section index');

    const questions = await QuestionBankItem.find({ _id: { $in: questionIds } });
    const newQuestions = questions.map((q, idx) => ({
      question: q._id,
      order: exam.sections[sectionIndex].questions.length + idx,
      marks: q.marks,
    }));

    exam.sections[sectionIndex].questions.push(...newQuestions);

    // Recalculate total marks
    let totalMarks = 0;
    exam.sections.forEach(s => s.questions.forEach(q => { totalMarks += q.marks || 0; }));
    exam.settings.totalMarks = totalMarks;

    await exam.save();
    ApiResponse.success(res, { exam }, 'Questions added to section');
  } catch (error) { next(error); }
};

exports.publishExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found');

    const totalQuestions = exam.sections.reduce((sum, s) => sum + s.questions.length, 0);
    if (totalQuestions === 0) throw ApiError.badRequest('Cannot publish exam with no questions');

    exam.status = 'published';
    exam.publishedAt = new Date();
    exam.accessCode = exam.accessCode || generateCode(6);
    await exam.save();

    ApiResponse.success(res, { exam }, 'Exam published');
  } catch (error) { next(error); }
};

exports.updateExamStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const exam = await Exam.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!exam) throw ApiError.notFound('Exam not found');

    const validTransitions = {
      draft: ['review'],
      review: ['approved', 'draft'],
      approved: ['published', 'draft'],
      published: ['archived'],
      archived: ['draft'],
    };

    if (!validTransitions[exam.status]?.includes(status)) {
      throw ApiError.badRequest(`Cannot transition from ${exam.status} to ${status}`);
    }

    if (comment) {
      exam.reviewComments.push({ userId: req.user._id, comment });
    }

    if (status === 'approved') exam.approvedBy = req.user._id;
    exam.status = status;
    await exam.save();

    ApiResponse.success(res, { exam }, `Exam status updated to ${status}`);
  } catch (error) { next(error); }
};

exports.getExamByCode = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({
      accessCode: req.params.code,
      status: 'published',
      isActive: true,
    }).select('title description subject settings.duration settings.instructions settings.scheduledStart settings.scheduledEnd');

    if (!exam) throw ApiError.notFound('Exam not found or not available');
    ApiResponse.success(res, { exam });
  } catch (error) { next(error); }
};

exports.getExamHealth = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, institution: req.user.institution })
      .populate('sections.questions.question');
    if (!exam) throw ApiError.notFound('Exam not found');

    const allQuestions = exam.sections.flatMap(s =>
      s.questions.map(q => q.question).filter(Boolean)
    );

    const health = {
      totalQuestions: allQuestions.length,
      totalMarks: exam.settings.totalMarks,
      topicCoverage: {},
      difficultyDistribution: { easy: 0, medium: 0, hard: 0, expert: 0 },
      bloomDistribution: { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 },
      typeDistribution: { mcq: 0, subjective: 0, coding: 0 },
      estimatedTime: 0,
      issues: [],
    };

    allQuestions.forEach(q => {
      health.difficultyDistribution[q.difficulty] = (health.difficultyDistribution[q.difficulty] || 0) + 1;
      health.bloomDistribution[q.bloomLevel] = (health.bloomDistribution[q.bloomLevel] || 0) + 1;
      health.typeDistribution[q.type] = (health.typeDistribution[q.type] || 0) + 1;
      health.topicCoverage[q.topic || 'uncategorized'] = (health.topicCoverage[q.topic || 'uncategorized'] || 0) + 1;
      health.estimatedTime += q.estimatedTime || 2;
    });

    // Check for issues
    if (allQuestions.length < 5) health.issues.push('Very few questions');
    if (health.difficultyDistribution.easy === allQuestions.length) health.issues.push('All questions are easy');
    if (health.estimatedTime > exam.settings.duration * 1.2) health.issues.push('Estimated time exceeds duration');
    if (Object.keys(health.topicCoverage).length < 2) health.issues.push('Low topic diversity');

    const score = Math.max(0, 100 - health.issues.length * 15);
    health.score = score;

    ApiResponse.success(res, { health });
  } catch (error) { next(error); }
};

exports.createFromAi = async (req, res, next) => {
  try {
    const { logId } = req.body;
    if (!logId) throw ApiError.badRequest('logId is required');

    const log = await AiGenerationLog.findOne({ _id: logId, userId: req.user._id });
    if (!log || !log.parsedOutput) {
      throw ApiError.notFound('AI generation log not found or incomplete');
    }

    const examData = log.parsedOutput;
    
    // Create the exam structure
    const exam = new Exam({
      title: examData.title || 'AI Generated Exam',
      description: examData.description || '',
      subject: examData.subject || '',
      topics: examData.topics || [],
      institution: req.user.institution,
      createdBy: req.user._id,
      settings: {
        duration: examData.duration || 60,
        instructions: examData.instructions || '',
        totalMarks: 0,
      },
      sections: [],
    });

    let globalOrder = 0;
    let totalExamMarks = 0;

    // Process sections and questions
    for (const [sectionIndex, sectionData] of (examData.sections || []).entries()) {
      const section = {
        title: sectionData.title || `Section ${sectionIndex + 1}`,
        instructions: sectionData.instructions || '',
        order: sectionIndex,
        questions: [],
      };

      for (const qData of sectionData.questions || []) {
        // Create question bank item
        const question = await QuestionBankItem.create({
          type: qData.type || 'mcq',
          text: qData.text,
          options: qData.options || [],
          correctAnswer: qData.correctAnswer || '',
          explanation: qData.explanation || '',
          difficulty: qData.difficulty || 'medium',
          bloomLevel: qData.bloomLevel || 'understand',
          subject: examData.subject || '',
          topic: qData.topic || '',
          marks: qData.marks || 1,
          estimatedTime: qData.estimatedTime || 2,
          rubric: qData.rubric || '',
          modelAnswer: qData.modelAnswer || '',
          institution: req.user.institution,
          createdBy: req.user._id,
          source: 'ai_generated',
          aiGenerationId: log._id,
        });

        section.questions.push({
          question: question._id,
          order: globalOrder++,
          marks: question.marks,
        });

        totalExamMarks += question.marks;
      }

      exam.sections.push(section);
    }

    exam.settings.totalMarks = totalExamMarks;
    await exam.save();

    ApiResponse.created(res, { exam }, 'Exam created successfully from AI blueprint');
  } catch (error) { next(error); }
};

exports.saveAiDraft = async (req, res, next) => {
  try {
    const examData = req.body;
    if (!examData || !examData.title) throw ApiError.badRequest('Invalid exam data');

    let exam;
    if (examData._id) {
      exam = await Exam.findOne({ _id: examData._id, institution: req.user.institution });
      if (exam) {
        // Save version before update
        exam.versions.push({
          title: exam.title,
          sections: exam.sections,
          settings: exam.settings,
          updatedBy: req.user._id,
        });
        
        // Update basic fields
        exam.title = examData.title;
        exam.description = examData.description;
        exam.subject = examData.subject;
        exam.topics = examData.topics;
        exam.settings.duration = examData.duration || exam.settings.duration;
        exam.settings.instructions = examData.instructions || exam.settings.instructions;
        
        // Update sections and questions - Need to handle this carefully
        // For simplicity, we'll replace the sections but keep existing questions in bank
        const newSections = [];
        let totalMarks = 0;
        
        for (const [sIdx, sData] of (examData.sections || []).entries()) {
          const section = {
            title: sData.title || `Section ${sIdx + 1}`,
            instructions: sData.instructions || '',
            order: sIdx,
            questions: [],
          };
          
          for (const qData of (sData.questions || [])) {
            let questionId = qData.question?._id || qData.question;
            
            // If the question is new (from AI) and doesn't have an ID, create it
            if (!questionId || (typeof questionId === 'string' && questionId.startsWith('temp_'))) {
               const question = await QuestionBankItem.create({
                 ...qData,
                 institution: req.user.institution,
                 createdBy: req.user._id,
                 source: 'ai_generated',
               });
               questionId = question._id;
            }
            
            section.questions.push({
              question: questionId,
              order: section.questions.length,
              marks: qData.marks || 1,
            });
            totalMarks += qData.marks || 1;
          }
          newSections.push(section);
        }
        
        exam.sections = newSections;
        exam.settings.totalMarks = totalMarks;
        await exam.save();
        return ApiResponse.success(res, { exam }, 'Exam updated from AI draft');
      }
    }

    // Create new exam if not found or no ID
    exam = new Exam({
      title: examData.title || 'AI Generated Exam',
      description: examData.description || '',
      subject: examData.subject || '',
      topics: examData.topics || [],
      institution: req.user.institution,
      createdBy: req.user._id,
      settings: {
        duration: examData.duration || 60,
        instructions: examData.instructions || '',
        totalMarks: 0,
      },
      sections: [],
    });

    let globalOrder = 0;
    let totalExamMarks = 0;

    for (const [sectionIndex, sectionData] of (examData.sections || []).entries()) {
      const section = {
        title: sectionData.title || `Section ${sectionIndex + 1}`,
        instructions: sectionData.instructions || '',
        order: sectionIndex,
        questions: [],
      };

      for (const qData of sectionData.questions || []) {
        const question = await QuestionBankItem.create({
          type: qData.type || 'mcq',
          text: qData.text,
          options: qData.options || [],
          correctAnswer: qData.correctAnswer || '',
          explanation: qData.explanation || '',
          difficulty: qData.difficulty || 'medium',
          bloomLevel: qData.bloomLevel || 'understand',
          subject: examData.subject || exam.subject || '',
          topic: qData.topic || '',
          marks: qData.marks || 1,
          estimatedTime: qData.estimatedTime || 2,
          rubric: qData.rubric || '',
          modelAnswer: qData.modelAnswer || '',
          institution: req.user.institution,
          createdBy: req.user._id,
          source: 'ai_generated',
        });

        section.questions.push({
          question: question._id,
          order: globalOrder++,
          marks: question.marks,
        });

        totalExamMarks += question.marks;
      }
      exam.sections.push(section);
    }

    exam.settings.totalMarks = totalExamMarks;
    await exam.save();

    ApiResponse.created(res, { exam }, 'Exam draft saved successfully');
  } catch (error) { next(error); }
};


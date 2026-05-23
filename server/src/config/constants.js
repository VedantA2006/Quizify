module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    INSTITUTION_OWNER: 'institution_owner',
    FACULTY: 'faculty',
    EVALUATOR: 'evaluator',
    STUDENT: 'student',
  },
  QUESTION_TYPES: {
    MCQ: 'mcq',
    SUBJECTIVE: 'subjective',
    CODING: 'coding',
  },
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard', 'expert'],
  BLOOM_LEVELS: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
  EXAM_STATUS: {
    DRAFT: 'draft',
    REVIEW: 'review',
    APPROVED: 'approved',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
  },
  ATTEMPT_STATUS: {
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    EVALUATED: 'evaluated',
    PUBLISHED: 'published',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};

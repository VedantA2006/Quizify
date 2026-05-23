const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ic = require('../controllers/institutionController');

// PUBLIC CLASS INVITE ROUTE
router.get('/classrooms/invite/:slug', ic.resolveClassroomInvite);

router.use(auth);

router.get('/mine', ic.getMyInstitution);
router.put('/mine', authorize('institution_owner', 'super_admin'), ic.updateInstitution);

// Departments
router.get('/departments', ic.getDepartments);
router.post('/departments', authorize('institution_owner', 'super_admin'), ic.createDepartment);
router.put('/departments/:id', authorize('institution_owner', 'super_admin'), ic.updateDepartment);
router.delete('/departments/:id', authorize('institution_owner', 'super_admin'), ic.deleteDepartment);

// Classrooms Routing (Phase 2.3)
router.get('/classrooms', ic.getClassrooms);
router.post('/classrooms/join', ic.joinClassroomByCode);
router.get('/classrooms/:id', ic.getClassroomDetail);
router.post('/classrooms', authorize('institution_owner', 'faculty', 'super_admin'), ic.createClassroom);
router.put('/classrooms/:id', authorize('institution_owner', 'faculty', 'super_admin'), ic.updateClassroom);
router.post('/classrooms/:id/announcements', authorize('institution_owner', 'faculty', 'super_admin'), ic.addAnnouncement);
router.delete('/classrooms/:id/students/:studentId', authorize('institution_owner', 'faculty', 'super_admin'), ic.removeStudentFromClass);

// Legacy flat classes
router.get('/classes', ic.getClasses);
router.post('/classes', authorize('institution_owner', 'faculty', 'super_admin'), ic.createClass);
router.put('/classes/:id', authorize('institution_owner', 'faculty', 'super_admin'), ic.updateClass);
router.delete('/classes/:id', authorize('institution_owner', 'super_admin'), ic.deleteClass);

// Members
router.get('/members', authorize('institution_owner', 'faculty', 'super_admin'), ic.getMembers);
router.post('/members', authorize('institution_owner', 'super_admin'), ic.addMember);
router.put('/members/:id', authorize('institution_owner', 'super_admin'), ic.updateMember);
router.delete('/members/:id', authorize('institution_owner', 'super_admin'), ic.removeMember);

module.exports = router;

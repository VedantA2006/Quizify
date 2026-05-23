const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ic = require('../controllers/institutionController');

router.use(auth);

router.get('/mine', ic.getMyInstitution);
router.put('/mine', authorize('institution_owner', 'super_admin'), ic.updateInstitution);

// Departments
router.get('/departments', ic.getDepartments);
router.post('/departments', authorize('institution_owner', 'super_admin'), ic.createDepartment);
router.put('/departments/:id', authorize('institution_owner', 'super_admin'), ic.updateDepartment);
router.delete('/departments/:id', authorize('institution_owner', 'super_admin'), ic.deleteDepartment);

// Classes
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

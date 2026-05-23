const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const admin = require('../controllers/adminController');

router.use(auth);
router.get('/', admin.getSearchResults);

module.exports = router;

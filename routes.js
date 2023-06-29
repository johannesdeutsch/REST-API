'use strict';

const express = require('express');
const { User, Course } = require('./models');
const { asyncHandler } = require('./middleware/async-handler');
const { authenticateUser } = require('./middleware/auth-user');

const router = express.Router();

router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = await req.currentUser;
    res.json(user);
}));


module.exports = router;
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

router.post('/users', authenticateUser, asyncHandler(async (req, res) => {
    const newUser = await User.create(req.body);
    res.location('/');
    res.status(201).json(newUser);
}));

//Retrieve a collection of all courses and a 200 HTTP status code
router.get('/courses', authenticateUser, asyncHandler(async (req, res) => {
    const courses = await Course.findAll();
    res.json(courses);
}));

router.get('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const userCourse = await Course.findByPk(req.params.id);
    res.json(userCourse);
}));

router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
    const newCourse = await Course.create(req.body);
    console.log(req.body);
    console.log(res);
    res.location(`/courses/${newCourse.userId}`);
    res.status(201).json(newCourse);
}));

module.exports = router;
'use strict';

const express = require('express');
const { User, Course } = require('./models');
const { asyncHandler } = require('./middleware/async-handler');
const { authenticateUser } = require('./middleware/auth-user');

const router = express.Router();

router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const authenticatedUser = await req.currentUser;
    res.json(authenticatedUser);
}));

router.post('/users', authenticateUser, asyncHandler(async (req, res) => {
    const newUser = await User.create(req.body);
    const errors = [];
    if (!newUser.firstName) {
        errors.push('Please provide a value for the "first name"');
    }
    if (!newUser.lastName) {
        errors.push('Please provide a value for the "last name"'); 
    }
    if (!newUser.emailAddress) {
        errors.push('Please provide a value for the "email address"'); 
    }
    if (!newUser.password) {
        errors.push('Please provide a value for the "password"'); 
    }
    if (errors.length > 0) {
        res.status(400).json({ errors });
    } else {
        res.location('/');
        users.push(newUser);
        res.status(201).json(newUser);
        
    }
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
    res.location(`/courses/${newCourse.id}`);
    res.status(201).json(newCourse);
}));

router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const findCourseToUpdate = await Course.findByPk(req.params.id);
    const updateCourse = await findCourseToUpdate.update(req.body);
    res.status(204).json(updateCourse);
}));

router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const findCourseToDelete = await Course.findByPk(req.params.id);
    const deleteCourse = await findCourseToDelete.destroy();
    res.status(204).json(deleteCourse);
}));

module.exports = router;
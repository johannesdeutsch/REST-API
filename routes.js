'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { User, Course } = require('./models');
const { asyncHandler } = require('./middleware/async-handler');
const { authenticateUser } = require('./middleware/auth-user');


const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, 'seed', 'data.json');

const router = express.Router();

//show the currently authenticated user
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const authenticatedUser = await req.currentUser;
    // Exceeds: extract the desired properties...
    const { id, firstName, lastName, emailAddress } = authenticatedUser;
    //... and create a new object with the filtered properties
    const filteredProperties = { id, firstName, lastName, emailAddress };
    res.json(filteredProperties);
}));

// create a new user
router.post('/users', asyncHandler(async (req, res) => {
    try {
        const newUser = await User.create(req.body);
        const errors = [];
        
        //check validation
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
            res.status(201).end();        
        }
    } catch(error) {
        console.error(error);
        if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map((err) => err.message);
            res.status(400).json({ errors: validationErrors });
        }
    }
}));


//Retrieve a collection of all courses and a 200 HTTP status code
router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
        include: {
            model: User, 
            attributes: ['id', 'firstName', 'lastName', 'emailAddress']
        }
    });
    //Exceeds: Iterate over each course to extract the desired properties...
    const filteredProperties = courses.map(course => {
        const { 
            id, title, description, estimatedTime, materialsNeeded, User: { id: userId, firstName, lastName, emailAddress } 
        } = course;
        return { 
            id, title, description, estimatedTime, materialsNeeded, User: { id: userId, firstName, lastName, emailAddress } 
        };
    });
    res.json(filteredProperties);
}));

//show a specific course based on its ID
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const userCourse = await Course.findByPk(req.params.id, {
        include: {
            model: User, 
            attributes: ['id', 'firstName', 'lastName', 'emailAddress']         
   }});
    //filter the following properties
    const { id, title, description, estimatedTime, materialsNeeded, User: { id: userId, firstName, lastName, emailAddress }  } = userCourse;
    const filteredProperties = { id, title, description, estimatedTime, materialsNeeded, User: { id: userId, firstName, lastName, emailAddress }  };
    res.json(filteredProperties);
}));


//create a new course
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {   
    
    try {
        const newCourse = await Course.create(req.body);
        const errors = [];
        //check validation
        if (!newCourse.title) {
            errors.push('Please provide a value for the "title"');
        }
        if (!newCourse.description) {
            errors.push('Please provide a value for the "description"'); 
        }
        if (errors.length > 0) {
            res.status(400).json({ errors });
        } else {
            res.location(`/courses/${newCourse.id}`);
            res.status(201).end();  
        }
    } catch(error) {
        //this is a code snippet from chat.openai.com
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map((err) => err.message);
            res.status(400).json({ errors: validationErrors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}));

//update course route
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    try {
      const authenticatedUser = await req.currentUser;
      const findCourseToUpdate = await Course.findByPk(req.params.id);
  
      // Check if the authenticated user is the owner of the course
      if (findCourseToUpdate.userId !== authenticatedUser.id) {
        res.status(403).json({ error: 'Sorry, but you are not the owner of this course.' });
        return;
      }
  
      // Update the course properties
      findCourseToUpdate.set(req.body);
  
      // Validate the updated course
      const validationResult = await findCourseToUpdate.validate();
  
      // If there are validation errors, return the error messages
      if (validationResult && validationResult.errors && validationResult.errors.length > 0) {
        const errorMessages = validationResult.errors.map((error) => error.message);
        res.status(400).json({ errors: errorMessages });
        return;
      }
  
      // If validation passes, save the changes
      await findCourseToUpdate.save();
      res.status(204).end();
    } catch (error) {
      console.log('ERROR: ', error.name);
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  }));


//delete course route
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    try {
        const authenticatedUser = await req.currentUser;
        const findCourseToDelete = await Course.findByPk(req.params.id);
        
        // The following two conditionals are a code snippet from chat.openai.com question 
        // Check if the course exists
        if (!findCourseToDelete) {
            res.status(404).json({ error: 'Sorry, this course does not exist' });
            return;
        }
    
        // Check if the authenticated user is the owner of the course
        if (findCourseToDelete.userId !== authenticatedUser.id) {
            res.status(403).json({ error: 'Sorry, but you are not the owner of this course.' });
            return;
        }

        const deleteCourse = await findCourseToDelete.destroy();
        res.status(204).json(deleteCourse);

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' }); 
    }
}));

module.exports = router;
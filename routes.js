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
//        const jsonData = await readDataFromFile();
//        let users = jsonData.users;
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
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(`${newUser.password}`, salt);
        //update the password:
        newUser.password = hashedPassword;
        //saving the new User to the database
        await newUser.save();
        //users.push(newUser);
        res.status(201).json(newUser);        
    }
    } catch(error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ error: 'This email address exists already in our database' });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
//} catch (err) {
//    console.error(err);
//    res.status(500).json({ error: 'Internal Server Error' });
//}
}));


// this function is a code snippet from chat.openai.com, I tried to define the users variable in data.json
/* function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (parseError) {
            reject(parseError);
          }
        }
      });
    });
  } */

//Retrieve a collection of all courses and a 200 HTTP status code
router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.findAll();
    // Exceeds: extract the desired properties...
    const { id, title, description, estimatedTime, materialsNeeded, userId } = courses;
    //... and create a new object with the filtered properties
    const filteredProperties = { id, title, description, estimatedTime, materialsNeeded, userId };
    res.json(filteredProperties);
}));

router.get('/courses/:id', asyncHandler(async (req, res) => {
    const userCourse = await Course.findByPk(req.params.id);
    const { id, title, description, estimatedTime, materialsNeeded, userId } = userCourse;
     //... and create a new object with the filtered properties
     const filteredProperties = { id, title, description, estimatedTime, materialsNeeded, userId };
    res.json(filteredProperties);
}));


//create a new course
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {   
        const newCourse = await Course.create(req.body);
        const errors = [];
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
        res.status(201).json(newCourse);   
    }
}));

router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    try {
        const authenticatedUser = await req.currentUser;
        const findCourseToUpdate = await Course.findByPk(req.params.id);
         
        // The following two conditionals are a code snippet from chat.openai.com question 
        // Check if the course exists
        if (!findCourseToUpdate) {
            res.status(404).json({ error: 'Sorry, this course does not exist' });
            return;
        }
    
        // Check if the authenticated user is the owner of the course
        if (findCourseToUpdate.userId !== authenticatedUser.id) {
            res.status(403).json({ error: 'Sorry, but you are not the owner of this course.' });
            return;
        }

        const updateCourse = await findCourseToUpdate.update(req.body);
        const errors = [];
        if (!updateCourse.title) {
            errors.push('Please provide a value for the "title"');
        }
        if (!updateCourse.description) {
            errors.push('Please provide a value for the "description"'); 
        }
        if (errors.length > 0) {
            res.status(400).json({ errors });
        } else {
            res.status(204).json(updateCourse);
        } 
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }  
}));

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
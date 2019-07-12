const express = require('express');
const router = express.Router();
const Schedule = require('../models').Schedule;
const jwt = require('jsonwebtoken');

function verifyToken (req,res,next) {
    const token = req.params.token;
    console.log(token);
    if(!token) {
        res.status(400).json({message:'token not provided'});
        return
    }
    jwt.verify(token,'shhhhh',(error,userObj) => {
        if(error){
            res.status(400).json({message:'invalid token'});
            return 
        }
        req.user=userObj 
        next()
    })
}

router.get('/', (req, res) => {
    res.json({
        message: 'testing get endpoint',
    })
});

router.get('/all/:token',verifyToken,(req, res) => {
    Schedule 
    .find({person:req.user.id})
    .then(schedules => res.json(schedules))
    .catch(err => {
        console.error(err);
        res.status(500).json({message:'Internal server error'})
    });
});    
    
router.get('/one/:id/:token',verifyToken,(req,res) => {
    Schedule 
    .findById(req.params.id)
    .then(schedule => {
        if(schedule.person===req.user.id) {
        res.json(schedule.serialize())
        }
        else {
            res.status(400).json({message:'User does not belong to schedule'})
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({message:'Internal server error'})
    });
});

router.get('/schedule',(req,res)=> {
    const filters = {};
    const queryableFields = ['startDate', 'endDate', 'event'];
    queryableFields.forEach(field => {
        if(req.query[field]) {
            filters[field] = req.query[field];
        }
    });
    Schedule
        .find(filters)
        .then(schedule => res.json(
            Schedule.map(schedule => schedule.serialize())
        ))
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'})
        });
});


router.post('/new', (req, res) => { 
    console.log(req.body);
    const requiredFields = ['location', 'startDate','endDate', 'event'];
    for (let i=0; i<requiredFields.length; i++) {
        const field= requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing ${field} in request body`
            console.error(message);
            return res.status(400).send(message);
        }
    }
    Schedule
        .create({
            person: req.user.id,
            location: req.body.location,                                   
            startDate: req.body.startDate,
            startTime: req.body.startTime,
            endDate: req.body.endDate,
            endTime: req.body.endTime,
            event: req.body.event 
        })
        .then(schedule => res.status(201).json(schedule.serialize()))
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        });
});

router.put('/one/:id/:token',verifyToken, (req,res) => {
    if(!(req.params.id && req.body.id && req.param ===req.body.id)) {
        const message = 
            `Request path id (${req.params.id}) and request body id` +
            `(${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({
            message: message
        });
    }
    const toUpdate = {};
    const updateableFields = ['location','startDate','startTime','endDate','endTime','event'];

    updateableFields.forEach(field=> {
        if(field in req.body){
            toUpdate[field] = req.body[field];
        }
    });

    Schedule 
        .findById(req.params.id)
        //.findByIDAndUpdate(req.params.id, {$set:toUpdate})
        .then(schedule => {
           if(schedule.person ===req.user.id) {
            schedule.location = req.body.location,
            schedule.startDate = req.body.startDate,
            schedule.endDate = req.body.endDate,
            schedule.event = req.body.event
            schedule.save()
            .then(schedule => schedule.serialize())
            .catch(err => res.status(500).json({message: 'Internal server error'}));
           }
           else{
               res.status(400).json({message:'schedule does not match'});
           }
        })
        .catch(err => res.status(500).json({message: 'Internal server error'}));
});

router.delete('/one/:id',(req,res)=> {
    Schedule
        .findByIDAndRemove(req.params.id)
        .then(() => {
            res.status(204).end();
        });
});

module.exports = router;

//ability to create event
////= event name
////event date/time
//// assign ppl (search by name, last, or status, only dates entered)
//// if available = green and can be assigned
//// if unavailable red w/ event listed undername

//ability to search for users and their schedules
// can see a month calendar of their plans

//create travel dates
////ability to remove, update, add


////once travel plans are created, all users can see
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const Schema = mongoose.Schema


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

//app configurations
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
mongoose.connect(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });


const personSchema = new Schema({
    username: { type: String, unique: true, required: true }
})
const Athlete = mongoose.model('Athlete', personSchema)

const exerciseSchema = new Schema({
    user_id: String,
    description: String,
    duration: Number,
    date: Date
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

//app routes
app.post('/api/users', async(req, res) => {
    const username = req.body.username

    const newAthlete = new Athlete({ username: username })
    await newAthlete.save((err, data) => {
        if (err) {
            res.send("user already exist")

        } else {
            res.json({ username: data.username, _id: data.id })
        }
    })
})

app.get('/api/users', (req, res) => {
    Athlete.find({}, (err, data) => {
        if (!err) {
            res.json(data)
        } else {
            console.log("error finding athletes")
        }
    })
})

//60fee700ffbf5305a8315025
//60fee91c1a975e023d781c29
//61007583ba389e02bf560fb1

app.post('/api/users/:_id/exercises', async(req, res) => {
    //
    const id = req.params._id
    let username = ''
    await Athlete.findById(id, async(err, data) => {
        if (data == null) {
            res.json("no user found")
        } else {
            username = data.username

            let { description, duration, date } = req.body

            if (date == '') {
                let today = new Date()
                date = today.toDateString()
            }
            const newExercise = new Exercise({ user_id: id, description, duration, date })
            await newExercise.save((err, data) => {
                if (!err) {

                    res.json({ _id: id, username: username, date: new Date(data.date).toDateString(), duration: data.duration, description: data.description })
                    console.log({ _id: data.id, username: username, date: new Date(data.date).toDateString(), duration: data.duration, description: data.description })
                }
            })
        }
    })


})

app.get('/api/users/:_id/logs', async(req, res) => {
    const userid = req.params._id
    console.log(userid)
    await Athlete.findById(userid, async(err, data) => {
        if (!data) {
            res.json("unknown userid")
            console.log("unknown userid")
        } else {
            const username = data.username
            const { from, to, limit } = req.query
            console.log(req.query)
            await Exercise.find({ user_id: userid }, { date: { $gte: new Date(from), $lte: new Date(to) } }).select(["id", "description", "duration", "date"]).limit(+limit).exec((err, data) => {
                console.log(data)
                let Datalog = data.map(i => {
                    let dateFormat = new Date(i.date).toDateString();
                    return { id: i.id, description: i.description, duration: i.duration, date: dateFormat }
                })
                if (!data) {
                    res.json({
                        user_id: userid,
                        username: username,
                        count: 0,
                        log: []
                    })
                } else {
                    console.log(Datalog)
                    res.json({
                        user_id: userid,
                        username: username,
                        count: data.length,
                        log: Datalog
                    })
                }
            })
        }
    })
})


const listener = app.listen(process.env.PORT || 5000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
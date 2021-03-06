const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://keshav:lgZEEu3JQCNTU4Yn@space-invaders.pulps.mongodb.net/space-invaders?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const redis = require('redis');
const redisSpan = 300;
const redisConfig = {
    host: 'redis-11619.c212.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 11619,
    password: 'aFUbvjGyN6ltQO896XFw1SiBmRCZV7iF'
};
const client = redis.createClient(redisConfig);

const scoreSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    score: Number
});

const Score = mongoose.model('score', scoreSchema);

const PORT = process.env.PORT || 3000;

function getScores(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    client.get('scores', (err, data) => {
        if (err) {
            res.send('err');
        } else if (data !== null) {
            res.send(JSON.parse(data));
        } else {
            Score.find(function(err, scores) {
                if (err) {
                    res.send('err');
                } else {
                    scores.sort((a, b) => {
                        if(a._id < b._id) return -1;
                        if(a._id > b._id) return 1;
                        return 0;
                    });
                    client.setex('scores', redisSpan, JSON.stringify(scores));
                    res.send(scores);
                }
            });
        }
    });
}

function setScores(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://space-invaders-app.herokuapp.com');
    
    const curName = req.body.name;
    const curScore = Math.ceil(req.body.score);
    const maxLength = 10;

    Score.find(function(err, scores) {
        if (err) {
            res.send('err');
        } else {
            res.statusCode = 201;
            Score.deleteMany({}).then(function() {
                scores.forEach(ele => {
                    ele.score = parseInt(ele.score);
                });
                if (scores.length === 0) {
                    scores = [{
                        _id  : 1,
                        name : curName,
                        score: curScore
                    }];
                } else if (scores.length < maxLength) {
                    if (scores[scores.length - 1].score > curScore) {
                        scores.push({
                            _id  : scores.length,
                            name : curName,
                            score: curScore
                        });
                    } else {
                        for(let i=0 ; i<scores.length ; ++i) {
                            if(curScore >= scores[i].score) {
                                scores.splice(i, 0, {
                                    _id  : i+1,
                                    name : curName,
                                    score: curScore
                                });
                                break;
                            }
                        }
                    }
                } else {
                    for(let i=0 ; i<scores.length ; ++i) {
                        if(curScore >= scores[i].score) {
                            scores.splice(i, 0, {
                                _id  : i+1,
                                name : curName,
                                score: curScore
                            });
                            break;
                        }
                    }
                    while(scores.length > maxLength)
                        scores.pop();
                }

                for(i=0 ; i<scores.length ; ++i)
                    scores[i]._id = i+1;

                client.setex('scores', redisSpan, JSON.stringify(scores));
                Score.insertMany(scores)
                    .then(res.send(scores));
            });
        }
    });
}

app.get("/scores", getScores);
app.put("/scores", jsonParser, setScores);

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'https://space-invaders-app.herokuapp.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.listen(PORT, () => {
    console.log(`Server started at port: ${PORT}`);
});
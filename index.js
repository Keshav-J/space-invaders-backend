const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://keshav:FMoyhiGQmakj5Npy@space-invaders-0xdmm.mongodb.net/space-invaders', { useNewUrlParser: true, useUnifiedTopology: true });

const redis = require('redis');
const redisSpan = 120;
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
                    client.setex('scores', redisSpan, JSON.stringify(scores));
                    res.send(scores);
                }
            });
        }
    });
}

function setScores(req, res) {
    const curName = req.body.name;
    const curScore = req.body.score;
    
    Score.find(function(err, scores) {
        if (err) {
            res.send('err');
        } else {
            Score.remove({}).then(function() {
                if(scores.length != 0) {
                    var flag = false;
                    for(var i=0 ; i<scores.length ; ++i) {
                        if(curScore >= scores[i].score) {
                            scores.splice(i, 0, {
                                _id  : i+1,
                                name : curName,
                                score: curScore
                            });
                            flag = true;
                            break;
                        }
                    }
                    if(!flag) {
                        scores.push({
                            _id  : i+1,
                            name: curName,
                            score: curScore
                        });
                        while(scores.length > 10)
                            scores.pop();
                    }
                }
                else {
                    scores.push({
                        _id  : 1,
                        name: curName,
                        score: curScore
                    });
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

app.get("/getScores/", getScores);
app.post("/getScores/", getScores);
app.post("/setScores/", jsonParser, setScores);

app.listen(PORT, () => {
    console.log(`Server started at port: ${PORT}`);
});
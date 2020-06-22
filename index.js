const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://keshav:FMoyhiGQmakj5Npy@space-invaders-0xdmm.mongodb.net/space-invaders', { useNewUrlParser: true, useUnifiedTopology: true });

const scoreSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    score: Number
});

const Score = mongoose.model('score', scoreSchema);

app.get("/getScores/", function(req, res) {

    Score.find(function(err, scores) {
        if(err) {
            res.send('err');
        }
        else {
            res.send(scores);
        }
    });

});

app.post("/getScores/", function(req, res) {

    Score.find(function(err, scores) {
        if(err) {
            res.send('err');
        }
        else {
            res.send(scores);
        }
    });

});

app.post("/setScores/", jsonParser, function(req, res) {
    const curName = req.body.name;
    const curScore = req.body.score;
    
    Score.find(function(err, scores) {
        if(err) {
            res.send('err');
        }
        else {
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
                    }
                    while(scores.length > 10) {
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

                Score.insertMany(scores)
                    .then(res.send(scores));
            });
        }
    });
});


app.listen(process.env.PORT || 3000, function() {
    console.log('Server started at port: 3000');
});
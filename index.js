const express = require('express');

const app = express();

app.get("/", function(req, res) {
    // console.log(req);
    var scores = [
        {name: 'Ananth', score: 100},
        {name: 'Kalki', score: 99},
        {name: 'Yedhu', score: 98},
        {name: 'Krishnan', score: 97}
    ]
    res.send(scores);
});


app.listen(process.env.PORT, function() {
    console.log('Server started at port: 3000');
});
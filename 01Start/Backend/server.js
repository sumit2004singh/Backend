import express from 'express';

const app = express();

// app.get('/', (req, res) => {
//     res.send('Server is ready')
// });

//get a list of 5 jokes

app.get('/api/jokes', (req, res) => {
    const jokes = [
       {
        id:1 ,
        title:'A Joke' ,
        content:'Joke is funny'
       } ,
       {
        id:2 ,
        title:'Another Joke' ,
        content:'Joke is funny and hilartious'
       } ,
       {
        id:3 ,
        title:'third Joke' ,
        content:'Joke is funny third'
       } ,
       {
        id:4 ,
        title:'Fourth Joke' ,
        content:'Joke is funny fourth'
       } ,
       {
        id:5 ,
        title:'Fifth Joke' ,
        content:'Joke is funny fifth'
       }
    ];

    res.send(jokes);
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serve at http://localhost:${port}`);
});
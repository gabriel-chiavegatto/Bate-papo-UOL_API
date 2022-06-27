import express from "express";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import cors from 'cors';

const server = express();
server.use(cors());
server.use(express.json());

dotenv.config();
const client = new MongoClient(process.env.URL_CONNECT_MONGO);
let db;
client.connect().then( ()=>{
    db = client.db('batePapoUOL');
});

server.post('/participants', (req, res)=>{
    console.log('passei polo post');
    console.log(req.body);
    db.collection('participants').insertOne(req.body);
});
server.get('/participants', (req,res)=>{
    console.log('tentando buscar as mensagens');
    db.collection('partcipants').find().toArray().then(lista=>{
        console.log('achei a colleçao, toma ai')
        res.status(200).send(lista);
    })

});



console.log("I'm run here");
server.listen(5001);
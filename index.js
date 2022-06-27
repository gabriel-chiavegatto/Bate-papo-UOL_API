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







console.log("I'm run here");
server.listen(5001);
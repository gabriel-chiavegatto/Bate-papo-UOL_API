import express, {json} from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import joi from "joi";
import {MongoClient} from "mongodb";

const server = express();
server.use(json());
server.use(cors());
server.use(cors());
dotenv.config();

const cliente = new MongoClient(process.env.MONGO_URI);
let db;
cliente.connect().then(()=>{ db = cliente.db('batePapoUOL')});



server.listen(process.env.PORT, ()=>{console.log("Server ON")});
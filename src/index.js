import express, { application, json } from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import joi from "joi";
import { MongoClient } from "mongodb";
import dayjs from 'dayjs';

const server = express();
server.use(json());
server.use(cors());
server.use(cors());
dotenv.config();

const cliente = new MongoClient(process.env.MONGO_URI);
let db;
cliente.connect().then(() => { db = cliente.db('batePapoUOL') });

server.post('/participants', async (req, res) => {
    const { name } = req.body;

    try {
        const nameSchema = joi.string().min(2).required();
        const validation = nameSchema.validate(name);
        if (validation.error) { res.sendStatus(422); return }

        const usedName = await db.collection('participants').findOne({ name: name })
        if (usedName) { res.sendStatus(409); return }

        const dateNow = Date.now();
        const newUser = {
            name,
            lastStatus: dateNow
        }
        const hour = dayjs().format('HH:mm:ss');
        const loginMessage = {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: hour
        }
        await db.collection("participants").insertOne(newUser);
        await db.collection("messages").insertOne(loginMessage);
        res.sendStatus(201)

    } catch (error) {
        res.sendStatus(503)
    }
});

server.get("/participants", async (req, res) => {
    try {
        const participantsList = await db.collection('participants').find().toArray();
        res.status(200).send(participantsList)
    } catch {
        res.sendStatus(503)
    }
});

server.post("/messages", async (req, res) => {
    try {
        const { user } = req.headers;
        const userOnDB = await db.collection("participants").findOne({ name: user });
        if (!userOnDB) { res.sendStatus(422); return }

        const message = req.body;
        const messageSchema = joi.object({
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.string().required(),
        });
        const validationMessage = messageSchema.validate(message);

        if (validationMessage.error || (message.type !== 'message' && message.type !== 'private_message')) {
            res.sendStatus(422); return;
        }

        const messageTime = dayjs().format("HH:mm:ss");
        const toSaveOnDB = {
            from: user,
            to: message.to,
            text: message.text,
            type: message.type,
            time: messageTime
        };
        await db.collection('messages').insertOne(toSaveOnDB)
        res.sendStatus(201)
    } catch {
        res.sendStatus(503);
    }
});

server.get("/messages", async (req, res) => {
    const { user } = req.headers;
    const {limit} = req.query;
    try {
        const allMessages = await db.collection('messages').find().toArray();
        const filtredMessages = allMessages.filter(msg => {
            if (msg.to === "Todos" || msg.to === user) {
                return true
            } else {
                return false
            }
        });
        if(limit){
            const page = filtredMessages.slice(-limit);
            res.status(200).send(page);
            return;
        }
        res.status(200).send(filtredMessages);
    } catch(error) {
        console.log(error);
        res.status(422)
    }
});

server.post('/status', async(req,res)=>{
    const {user} = req.headers;
    try{
        const confirmParticiant = await db.collection('participants').findOne({name:user});
        if(!confirmParticiant){
            res.sendStatus(404);
            return
        }
        const timeNow = Date.now();
        await db.collection('participants').updateOne(confirmParticiant,{$set: {lastStatus: timeNow}});
        res.sendStatus(200);

    }catch{
        res.sendStatus(422);
    }
});

server.listen(process.env.PORT, () => { console.log("Server ON") });
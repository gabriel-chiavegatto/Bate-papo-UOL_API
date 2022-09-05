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
        const hour  = dayjs().format('HH:mm:ss');
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
        res.sendStatus(420)
    }
});


server.listen(process.env.PORT, () => { console.log("Server ON") });
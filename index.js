import express from "express";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import cors from 'cors';
import joi from 'joi';
import dayjs from "dayjs";

const server = express();
server.use(cors());
server.use(express.json());

dotenv.config();
const client = new MongoClient(process.env.URL_CONNECT_MONGO);
let db;
client.connect().then(() => {
    db = client.db('batePapoUOL');
});


server.post('/participants', async (req, res) => {

    const user = req.body;
    console.log(user);
    const userSchema = joi.object({
        name: joi.string().required()
    });
    const validation = userSchema.validate(user);
    console.log('sou a validation: ', validation)

    if (validation.error) {
        res.sendStatus(422);
        return
    }
    const dateNow = Date.now();
    console.log("datenow : ",dateNow);
    const userLogin = {
        name: user.name,
        lastStatus: dateNow
    }
    const date = dayjs().format('HH:mm:ss');
    console.log("horario: ",date)
    const loginMessage = {
        from: user.name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: date
    }

    try {
        await db.collection('participants').insertOne(userLogin)
        res.status(201).send();
        await db.collection('messages').insertOne(loginMessage)
    } catch (error) {
        console.log('detalhes do erro: ', error);
        res.sendStatus(422);
    }

});


server.get('/participants', (req, res) => {
    console.log('tentando buscar as mensagens');
    db.collection("participants").find().toArray().then(lista => {
        console.log('achei a colleçao, toma ai', lista)
        res.status(200).send(lista);
    });

});



console.log("I'm run here");
server.listen(5001);
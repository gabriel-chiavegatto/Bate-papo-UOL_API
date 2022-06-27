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
    console.log("datenow : ", dateNow);
    const userLogin = {
        name: user.name,
        lastStatus: dateNow
    }
    const date = dayjs().format('HH:mm:ss');
    console.log("horario: ", date)
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
    db.collection("participants").find().toArray().then(lista => {
        res.status(200).send(lista);
    });
});


server.post('/messages', (req, res) => {
    const message = req.body;
    const usuario = req.headers.user;
    const userSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required(),
    })
    const validationMessage = userSchema.validate(message);
    if (validationMessage.error) {
        res.status(422).send();
        return
    }
    if (message.type !== 'message' && message.type !== 'private_message') {
        res.status(422).send();
        return
    }
    const timeNow = dayjs().format("HH:mm:ss");
    const toSubmit = {
        from: usuario,
        to: message.to,
        text: message.text,
        type: message.type,
        time: timeNow
    }
    db.collection('messages').insertOne(toSubmit)
    res.status(201).send();
});


server.get('/messages', (req, res) => {
    const userOnline = req.headers.user;
    db.collection('messages').find().toArray().then(lista => {
        // filtrar só msgs para todos ou para o usuário em questão
        const filtred = lista.filter(item => {
            let toRender = false;
            if (item.to === "Todos" || item.to === userOnline) {
                toRender = true;
            } return toRender
        });
        res.send(filtred)
    });
});

server.post('/status', async (req, res) => {
    console.log(req.headers.user);
    const user = await db.collection('participants').findOne({ name: req.headers.user });
    console.log(user);
    if (!user) {
        res.status(404).send('voce não esta no banco de dados');
    }
    const whatTime = Date.now();
    await db.collection('participants').updateOne(
        user, { $set: { name: req.headers.user, lastStatus: whatTime } });
    res.status(200).send(user);

});
setInterval(offilineParticipants, 15000);

async function offilineParticipants() {
    const whatTime = Date.now();
    const hours = dayjs().format('HH:mm:ss')
    console.log(whatTime);

    const participantsOn = await db.collection("participants").find().toArray();
    console.log('participantsOn : ', participantsOn)
    participantsOn.forEach((item) => {
        if (!item.lastStatus) {
            db.collection('participants').deleteOne({ name: item.name })
        }
        if (item.lastStatus < whatTime - 10000) {
            db.collection('messages').insertOne(
                {
                    from: item.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: hours
                });
            db.collection('participants').deleteOne({ lastStatus: item.lastStatus })
        }
    });
}

console.log("I'm run here");
server.listen(5001);
import express, {json} from 'express';
import cors from 'cors';

const server = express();
server.use(json());
server.use(cors());





server.listen(5000, ()=>{console.log("Server ON")})
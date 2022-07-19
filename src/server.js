import express from 'express';
import cors from 'cors';
import { connect } from './utils/db.js';
import userRouter from './user/user.router.js';
export const app = express();

app.use(cors());
app.use(express.json());

app.use('/user', userRouter);

export const start = async () => {
  try {
    connect().then(() => {
      app.listen(3000, () => {
        console.log(`REST API on http://localhost:3000/`);
      });
    });
  } catch (e) {
    console.error(e);
  }
};

start();

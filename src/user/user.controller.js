import { getUser, createUser } from './user.crud.js';
import { newToken } from './user.auth.js';

export const findOne = async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) {
      return res.status(400).end();
    }
    res.status(200).json({ data: user });
  } catch (e) {
    console.error(e);
    res.status(400).end();
  }
};

export const createOne = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ message: 'need email and password' });
    }

    const user = await createUser(req.body);
    const token = newToken(user);
    res.status(200).json({ data: user, token: token });
  } catch (e) {
    console.error(e);
    res.status(400).end();
  }
};

import { User } from './user.model.js';

export const getAllUsers = () => {
  return User.find({}).exec();
};

export const createUser = (userDetails) => {
  return User.create(userDetails);
};

export const getUser = (id) => {
  return User.findById(id).exec();
};

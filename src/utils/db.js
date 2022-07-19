import mongoose from 'mongoose';

export const connect = (
  url = 'mongodb://root:rootpassword@localhost:27017/auth-server_mongodb_container_1?authSource=admin',
  opts = {}
) => {
  return mongoose.connect(url, { ...opts, useNewUrlParser: true });
};

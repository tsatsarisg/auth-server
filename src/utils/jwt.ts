import jwt from 'jsonwebtoken'
import envs from './env'
import { UserModel } from '../user/user.model'

const secretKey = envs('JWT_SECRET_KEY')

export const newToken = (user: UserModel) => {
    return jwt.sign({ id: user.id }, secretKey)
}

export const verifyToken = (token) => {
    new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, payload) => {
            if (err) return reject(err)
            resolve(payload)
        })
    })
}

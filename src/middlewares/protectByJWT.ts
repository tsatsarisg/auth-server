import { NextFunction, Request, Response } from 'express'
import UserMongoRepository from '../user/user.repository'
import { userCollection } from '..'
import { verifyToken } from '../utils/jwt'

const userRepository = new UserMongoRepository(userCollection())

const protectByJWT = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const bearer = req.headers.authorization

    if (!bearer || !bearer.startsWith('Bearer ')) {
        return res.status(401)
    }
    const token = bearer.split('Bearer ')[1].trim()

    let jwtPayload
    try {
        jwtPayload = await verifyToken(token)
        const user = await userRepository.findById(jwtPayload.id)

        if (!user) {
            return res.status(401)
        }
        res.locals.user = user
    } catch (e) {
        return res.status(401)
    }
    next()
}

export default protectByJWT

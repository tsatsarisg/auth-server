import { userCollection } from '..'
import UserMongoRepository from './user.repository'
import { Request, Response } from 'express'
import UserService from './user.service'
import UserAuthService from './user.auth'

export default class UserController {
    private userService: UserService
    private userAuthService: UserAuthService

    constructor() {
        const userRepository = new UserMongoRepository(userCollection())
        this.userService = new UserService(userRepository)
        this.userAuthService = new UserAuthService(userRepository)
    }

    async get(req: Request, res: Response) {
        const { id } = req.query

        try {
            if (!id) throw new Error('No matches found.')

            const user = await this.userService.get(id as string)
            return res.status(200).json(user)
        } catch (e) {
            return res.status(400)
        }
    }

    async login(req: Request, res: Response) {
        const { email, password } = req.body

        if (!email || !password) return res.status(401)

        try {
            const token = await this.userAuthService.login({ email, password })
            return res.status(200).json({ token })
        } catch (e) {
            return res.status(401)
        }
    }
}

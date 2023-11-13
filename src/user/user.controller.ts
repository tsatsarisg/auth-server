import { userCollection } from '..'
import UserMongoRepository from './user.repository'
import { Request, Response } from 'express'

export default class UserController {
    private userService: UserService

    constructor() {
        const userRepository = new UserMongoRepository(userCollection())
        this.userService = new UserService(userRepository)
    }

    async get(req: Request, res: Response) {
        const { id } = req.query
        if (!id) throw new Error('No matches found.')

        const franchise = await this.userService.getUserById(id as string)

        return res.status(200).json(franchise)
    }

    async create(req: Request, res: Response) {
        const franchiseProps = { ...req.body }
        const user = this.userService.create()

        return res.status(201).json(user)
    }
}

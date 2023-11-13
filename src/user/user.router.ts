import { Router } from 'express'
import UserController from './user.controller'

const router = () => {
    const servicePaths = Router()
    const franchiseController = new UserController()

    servicePaths.get(
        '/user/:id',
        franchiseController.get.bind(franchiseController)
    )

    return servicePaths
}

export default router

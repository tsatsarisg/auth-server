import { Router } from 'express'

const router = () => {
    const servicePaths = Router()
    const franchiseController = new UserController()

    servicePaths.get(
        '/user/:id',
        franchiseController.get.bind(franchiseController)
    )

    servicePaths.post(
        '/user/create',
        franchiseController.list.bind(franchiseController)
    )

    servicePaths.post(
        '/user/login',
        franchiseController.create.bind(franchiseController)
    )

    return servicePaths
}

export default router

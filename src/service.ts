import express, { Express } from 'express'
import cors from 'cors'
import routes from './routes'
import { MongoDomain } from './utils/MongoDBAdapter'
import envs from './utils/env'
import { Collection } from 'mongodb'

export default class Service {
    private app: Express
    private port: string
    private collection!: Collection

    constructor() {
        this.app = express()
        this.port = envs('PORT_NUMBER')
    }

    init() {
        this.app.use(express.json())
        this.app.use(cors())
        this.app.use(
            cors({
                origin: `http://localhost:${this.port}`,
            })
        )
    }

    async start() {
        await this.createConnection()
        this.setRoutes()

        const server = this.app.listen(this.port, () => {
            console.log(
                `⚡️ Server is running at http://localhost:${this.port}`
            )
        })

        return server
    }

    private setRoutes() {
        const v1Routes = routes.v1()
        this.app.use('/api/v1', Object.values(v1Routes))
    }

    private async createConnection() {
        const mongoDomain = new MongoDomain(envs('DOCKER_MONGO_URL'))

        try {
            await mongoDomain.connect(envs('DB_NAME'))
            this.collection = mongoDomain.collection('users')
        } catch (err) {
            console.error(err)
        }
    }

    get getCollection() {
        return this.collection
    }
}

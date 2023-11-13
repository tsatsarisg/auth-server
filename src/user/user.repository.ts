import { Collection, ObjectId } from 'mongodb'
import { buildUser } from './user.model'
import { UserRepository } from '../ts/interfaces'

export default class UserMongoRepository implements UserRepository {
    private collection: Collection

    constructor(props: any) {
        this.collection = props.collection
    }

    async findById(id: string) {
        const user = await this.collection.findOne({ _id: new ObjectId(id) })
        if (!user) throw new Error('User not found')

        return buildUser({
            id: user._id.toString(),
            email: user.email,
            password: user.password,
        })
    }

    async findByEmail(email: string) {
        const user = await this.collection.findOne({ email })
        if (!user) throw new Error('User not found')

        return buildUser({
            id: user._id.toString(),
            email: user.email,
            password: user.password,
        })
    }

    async createOne({ email, password }: { email: string; password: string }) {
        const result = await this.collection.insertOne({ email, password })
        if (!result.insertedId) throw new Error('User creation error')

        return buildUser({
            id: result.insertedId.toString(),
            email,
            password,
        })
    }
}

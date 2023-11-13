import { Collection, ObjectId } from 'mongodb'
import User from './user.model'

export default class UserMongoRepository {
    private collection: Collection

    constructor(props: any) {
        this.collection = props.collection
    }

    async findById(id: string) {
        const user = await this.collection.findOne({ _id: new ObjectId(id) })
        if (!user) throw new Error('User not found')

        return new User({
            id: user._id.toString(),
            email: user.email,
            password: user.password,
        })
    }

    async createOne({ email, password }: { email: string; password: string }) {
        const result = await this.collection.insertOne({ email, password })
        if (!result.insertedId) throw new Error('User creation error')

        return new User({
            id: result.insertedId.toString(),
            email,
            password,
        })
    }
}

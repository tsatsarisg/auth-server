import { UserModel } from '../user/user.model'

export interface UserRepository {
    findById(id: string): Promise<UserModel>
    findByEmail(email: string): Promise<UserModel>
    createOne({
        email,
        password,
    }: {
        email: string
        password: string
    }): Promise<UserModel>
}

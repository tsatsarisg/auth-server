import { UserRepository } from '../ts/interfaces'
import { newToken } from '../utils/jwt.js'

export default class UserAuthService {
    private userRepository: UserRepository

    constructor(props: any) {
        this.userRepository = props.userRepository
    }

    async login({ email, password }: { email: string; password: string }) {
        const user = await this.userRepository.findByEmail(email)
        if (user.password != password) {
            throw new Error('Invalid password')
        }

        const token = newToken(user)

        return token
    }
}

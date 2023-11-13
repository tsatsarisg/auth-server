import { UserRepository } from '../ts/interfaces'

export default class UserService {
    private userRepository: UserRepository

    constructor(props: any) {
        this.userRepository = props.userRepository
    }

    async get(id: string) {
        const user = await this.userRepository.findById(id)

        return user
    }
}

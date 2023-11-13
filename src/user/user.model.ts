export type UserModel = {
    id: string
    email: string
    password: string
}

export default class User {
    private id: string
    private email: string
    private password: string

    constructor(props: UserModel) {
        this.id = props.id
        this.email = props.email
        this.password = props.password
    }
}

export type UserModel = {
    id: string
    email: string
    password: string
}

export const buildUser = (props: UserModel) => {
    return {
        ...props,
    }
}

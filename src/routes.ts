import userRoutes from './user/user.router'
export default {
    v1: () => ({
        userRoutes: userRoutes(),
    }),
}

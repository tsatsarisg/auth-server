import { config } from 'dotenv'

config()

const envs = (envVariable: string) => {
    return process.env[envVariable] || ''
}

export default envs

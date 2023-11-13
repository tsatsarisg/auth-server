import Service from './service'

const microservice = new Service()

microservice.init()
microservice.start()

export function userCollection() {
    return microservice.getCollection
}

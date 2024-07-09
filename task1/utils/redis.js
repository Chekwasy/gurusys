import { createClient } from 'redis';
import { promisify } from 'util'

class RedisClient {
	constructor() {
		const client = createClient();
		this.clientConnected = true;
		client.on('error', (err) => {
			console.log(err.toString());
			this.clientConnected = false;
		});
		this.client = client;
	}

	isAlive() {
		return this.clientConnected;
	}

	async get(key) {
		return (promisify(this.client.GET).bind(this.client)(key));
	}

	async set(key, value, duration) {
		(promisify(this.client.SET).bind(this.client)(key, value, 'EX', duration));
	}

	async del(key) {
		promisify(this.client.DEL).bind(this.client)(key)
	}
}


const redisClient = new RedisClient();

export default redisClient;
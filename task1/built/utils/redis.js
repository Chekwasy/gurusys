var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createClient } from 'redis';
import { promisify } from 'util';
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
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return (promisify(this.client.GET).bind(this.client)(key));
        });
    }
    set(key, value, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            (promisify(this.client.SET).bind(this.client)(key, value, 'EX', duration));
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            promisify(this.client.DEL).bind(this.client)(key);
        });
    }
}
const redisClient = new RedisClient();
export default redisClient;
//# sourceMappingURL=redis.js.map
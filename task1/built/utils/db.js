var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MongoClient } from 'mongodb';
class DBClient {
    constructor() {
        const host = process.env.DB_HOST || '127.0.0.1';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'blog_chekwasy';
        const dbURL = `mongodb://${host}:${port}/${database}`;
        this.client = new MongoClient(dbURL, { useUnifiedTopology: true });
        this.isAliv = false; // added property to track connection status
        this.connect(); // call connect method to establish the connection
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.connect();
                this.isAliv = true; // set isAlive property to true after successful connection
            }
            catch (error) {
                console.error('Failed to connect to MongoDB:', error);
            }
        });
    }
    isAlive() {
        return this.isAliv;
    }
    nbUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.db().collection('users').estimatedDocumentCount();
        });
    }
    nbFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.db().collection('files').estimatedDocumentCount();
        });
    }
    nbBlog() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.db().collection('posts').estimatedDocumentCount();
        });
    }
}
const dbClient = new DBClient();
export default dbClient;
//# sourceMappingURL=db.js.map
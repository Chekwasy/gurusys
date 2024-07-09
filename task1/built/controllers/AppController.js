var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
/**
 * Contains the miscellanous handlers for site stability
 */
class AppController {
    static getStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //get status of redis server and database if its working
            let val1 = false;
            let val2 = false;
            val1 = redisClient.isAlive();
            val2 = yield dbClient.isAlive();
            if (val1 && val2) {
                res.status(200).json({ "redis": true, "db": true });
            }
        });
    }
    static getStats(req, res) {
        //get total users and files currently
        if (dbClient.isAlive()) {
            let val1 = 0;
            let val2 = 0;
            let val3 = 0;
            (() => __awaiter(this, void 0, void 0, function* () {
                val1 = yield dbClient.nbUsers();
                val2 = yield dbClient.nbFiles();
                val3 = yield dbClient.nbBlog();
            }))();
            res.status(200).json({ "users": val1, "files": val2, "games": val3 });
        }
    }
}
export default AppController;
module.exports = AppController;
//# sourceMappingURL=AppController.js.map
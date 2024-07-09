var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dbClient from '../utils/db';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
const { ObjectID } = require('mongodb');
/**
 * Contains user miscellanous handlers for users i.e signup
 */
class UsersController {
    static postNew(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //add new user
            const usr_det = req.body.emailpwd;
            if (!usr_det) {
                res.status(400).json({});
                return;
            }
            const encoded_usr_str = (usr_det.split(" "))[1];
            const decoded_usr_str = Buffer.from(encoded_usr_str, 'base64').toString('utf-8');
            const usr_details = decoded_usr_str.split(':');
            const password = usr_details[1];
            const email = usr_details[0];
            if (!email) {
                res.status(400).json({ "error": "Missing email" });
                return;
            }
            if (!password) {
                res.status(400).json({ 'error': 'Missing password' });
                return;
            }
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "email": email });
            if (user) {
                res.status(401).json({ 'error': 'Already exist' });
                return;
            }
            const result = yield (yield dbClient.client.db().collection('users'))
                .insertOne({ "email": email, "password": sha1(password), "first_name": '', "last_name": '', "phone": '', });
            const usrId = result.insertedId.toString();
            res.status(201).json({ "email": email });
        });
    }
    static getMe(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //check if user is logged in
            const x_tok = req.headers['x-token'];
            if (!x_tok) {
                res.status(400).json({});
                return;
            }
            const usr_id = yield redisClient.get(`auth_${x_tok}`);
            if (!usr_id) {
                res.status(401).json({});
                return;
            }
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "_id": ObjectID(usr_id) });
            if (!user) {
                res.status(401).json({});
                return;
            }
            res.json({ 'email': user.email,
                'first_name': user.first_name, 'last_name': user.last_name,
                'phone': user.phone
            });
        });
    }
    static putUpdate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //to update user information (first and last name and phone)
            const x_tok = req.headers['x-token'];
            if (!x_tok) {
                res.status(400).json();
                return;
            }
            const usr_id = yield redisClient.get(`auth_${x_tok}`);
            if (!usr_id) {
                res.status(401).json({ "error": "Unauthorized" });
                return;
            }
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "_id": ObjectID(usr_id) });
            if (!user) {
                res.status(400).json();
                return;
            }
            const first_name = req.body.first_name;
            const last_name = req.body.last_name;
            const phone = req.body.phone;
            if (!first_name || !last_name || !phone) {
                res.status(400).json({ "error": "missing data" });
                return;
            }
            yield (yield dbClient.client.db().collection('users'))
                .updateOne({ "_id": ObjectID(usr_id) }, { $set: { "first_name": first_name, "last_name": last_name, "phone": phone } });
            res.status(200).json({ "status": "ok" });
        });
    }
}
export default UsersController;
module.exports = UsersController;
//# sourceMappingURL=UsersController.js.map
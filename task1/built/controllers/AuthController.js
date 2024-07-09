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
import { v4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import Queue from 'bull/lib/queue';
const { ObjectID } = require('mongodb');
/**
 * Contains auth miscellanous handlers for user authentication
 */
class AuthController {
    static getConnect(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // check user input and create session. save to redis for a day session
            const auth_header = req.headers.authorization;
            if (!auth_header) {
                res.json();
                return;
            }
            const encoded_usr_str = (auth_header.split(" "))[1];
            const decoded_usr_str = Buffer.from(encoded_usr_str, 'base64').toString('utf-8');
            const usr_details = decoded_usr_str.split(':');
            const pwd = sha1(usr_details[1]);
            const email = usr_details[0];
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "email": email, "password": pwd });
            if (!user) {
                res.status(401).json({ 'error': 'Unauthorized' });
                return;
            }
            const auth_token = v4();
            redisClient.set(`auth_${auth_token}`, user._id.toString(), 7 * 24 * 60 * 60);
            res.status(200).json({ "token": auth_token });
        });
    }
    static getDisconnect(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //log the user our on a possible click to logout
            const x_tok = req.headers['x-token'];
            if (!x_tok) {
                res.json();
                return;
            }
            const usr_id = yield redisClient.get(`auth_${x_tok}`);
            if (!usr_id) {
                res.status(401).json({ "error": "Unauthorized" });
                return;
            }
            yield redisClient.del(`auth_${x_tok}`);
            res.status(204).json();
        });
    }
    static postSend_tok(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //send token to user and save the token on redis
            const email = req.body.email;
            if (!email) {
                res.json({});
                return;
            }
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "email": email });
            if (!user) {
                res.status(401).json({ 'error': 'No user found' });
                return;
            }
            const min = 123456;
            const max = 987654;
            const token = Math.floor(Math.random() * (max - min + 1)) + min;
            redisClient.set(email, token.toString(), 10 * 60);
            //create worker to send email token
            const tokenQueue = new Queue('Sending Token');
            const tokenJob = yield tokenQueue.add({ "email": email, "token": token.toString() });
            //send response
            res.json({ "status": "ok" });
        });
    }
    static postChecktoken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //check token for user
            const email = req.body.email;
            const token = req.body.token;
            if (!email || !token) {
                res.status(404).json({ 'error': "email or token missing" });
                return;
            }
            const tok = yield redisClient.get(email);
            if (!tok) {
                res.status(400).json({ 'error': 'token not found' });
                return;
            }
            if (tok !== token.toString()) {
                res.status(403).json({ 'error': 'wrong token' });
                return;
            }
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "email": email });
            if (!user) {
                res.status(401).json({ 'error': 'No user found' });
                return;
            }
            res.status(200).json({ 'status': 'ok' });
        });
    }
    static postPwdreset(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //reset password for user
            const auth_header = req.headers.authorization;
            if (!auth_header) {
                res.json();
                return;
            }
            const encoded_usr_str = (auth_header.split(" "))[1];
            const decoded_usr_str = Buffer.from(encoded_usr_str, 'base64').toString('utf-8');
            const usr_details = decoded_usr_str.split(':');
            const password = sha1(usr_details[1]);
            const email = usr_details[0];
            const token = req.body.token || null;
            if (!email) {
                res.status(400).json({ "error": "Missing email" });
                return;
            }
            if (!token) {
                res.status(400).json({ "error": "Missing token" });
                return;
            }
            if (!password) {
                res.status(400).json({ 'error': 'Missing password' });
                return;
            }
            const tok = yield redisClient.get(email);
            if (!tok) {
                res.status(400).json({ 'error': 'token not found' });
                return;
            }
            if (tok !== token.toString()) {
                res.status(403).json({ 'error': 'wrong token' });
                return;
            }
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "email": email });
            if (!user) {
                res.status(401).json({ 'error': 'No user found' });
                return;
            }
            yield (yield dbClient.client.db().collection('users'))
                .updateOne({ "_id": ObjectID(user._id) }, { $set: { "password": password } });
            res.status(200).json({ "status": "ok" });
        });
    }
}
export default AuthController;
module.exports = AuthController;
//# sourceMappingURL=AuthController.js.map
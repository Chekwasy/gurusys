import redisClient from '../utils/redis';
import { v4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import Queue from 'bull';
const { ObjectID } = require('mongodb');
import { Request, Response } from 'express';
/**
 * Contains auth miscellanous handlers for user authentication
 */
class AuthController {
	static async getConnect(req: Request, res: Response) {
		// check user input and create session. save to redis for a day session
		const auth_header: string = req.headers.authorization;
		if (!auth_header) { res.status(403).json(); return;}
		const encoded_usr_str: string = (auth_header.split(" "))[1];
		const decoded_usr_str: string = Buffer.from(encoded_usr_str, 'base64').toString('utf-8');
		const usr_details: Array<string> = decoded_usr_str.split(':');
		const pwd: string = sha1(usr_details[1]);
		const email: string = usr_details[0];
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "email": email, "password": pwd});
		if (!user) {
			res.status(401).json({'error': 'Unauthorized'});
			return;
		}
		const auth_token: string = v4();
		redisClient.set(`auth_${auth_token}`, user._id.toString(), 7 * 24 * 60 * 60);
		res.status(200).json({ "token": auth_token });
	}

	static async getDisconnect(req: Request, res: Response) {
		//log the user our on a possible click to logout
		const x_tok: string | string[] = req.headers['x-token'];
		if (!x_tok) { res.json(); return;}
		const usr_id = await redisClient.get(`auth_${x_tok}`);
		if (!usr_id) {
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		await redisClient.del(`auth_${x_tok}`);
		res.status(204).json();
	}

	static async postSend_tok(req: Request, res: Response) {
		//send token to user and save the token on redis
		const email: string = req.body.email;
		if (!email) {
			res.json({}); return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "email": email});
		if (!user) {
			res.status(401).json({'error': 'No user found'});
			return;
		}
		const min: number = 123456;
		const max: number = 987654;
		const token: number = Math.floor(Math.random() * (max - min + 1)) + min;
		redisClient.set(email, token.toString(), 10 * 60);

		//create worker to send email token
		interface tokendata {
			email: string;
			token: string;
		}
		const tokenQueue = new Queue<tokendata>('Sending Token');
		const tokenJob = await tokenQueue.add({"email": email, "token": token.toString()});

		//send response
		res.json({"status": "ok"});
	}

	static async postChecktoken(req: Request, res: Response) {
		//check token for user
		const email: string = req.body.email;
		const token: string = req.body.token;
		if (!email || !token) {
			res.status(404).json({'error': "email or token missing"}); return;
		}
		const tok: any = await redisClient.get(email);
		if (!tok) {
			res.status(400).json({'error': 'token not found'}); return;
		}
		if (tok !== token.toString()) {
			res.status(403).json({'error': 'wrong token'}); return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "email": email});
		if (!user) {
			res.status(401).json({'error': 'No user found'});
			return;
		}

		res.status(200).json({'status': 'ok'});
	}

	static async postPwdreset(req: Request, res: Response) {
		//reset password for user
		const auth_header: string = req.headers.authorization;
		if (!auth_header) { res.json(); return;}
		const encoded_usr_str: string = (auth_header.split(" "))[1];
		const decoded_usr_str: string = Buffer.from(encoded_usr_str, 'base64').toString('utf-8');
		const usr_details: Array<string> = decoded_usr_str.split(':');
		const password: string = sha1(usr_details[1]);
		const email: string = usr_details[0];
		const token: string | null = req.body.token || null;
		if (!email) {
			res.status(400).json({"error": "Missing email"});
			return;
		}
		if (!token) {
			res.status(400).json({"error": "Missing token"});
			return;
		}
		if (!password) {
			res.status(400).json({'error': 'Missing password'});
			return;
		}
		const tok = await redisClient.get(email);
		if (!tok) {
			res.status(400).json({'error': 'token not found'}); return;
		}
		if (tok !== token.toString()) {
			res.status(403).json({'error': 'wrong token'}); return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "email": email});
		if (!user) {
			res.status(401).json({'error': 'No user found'});
			return;
		}
		await (await dbClient.client.db().collection('users'))
		.updateOne({ "_id": ObjectID(user._id) },
		{ $set: { "password": password } });
		res.status(200).json({"status": "ok"})
	}
}


export default AuthController;
module.exports = AuthController;
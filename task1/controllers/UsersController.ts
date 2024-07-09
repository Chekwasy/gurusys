import dbClient from '../utils/db';
import Queue from 'bull';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
const { ObjectID } = require('mongodb');
import { Request, Response } from 'express';

/**
 * Contains user miscellanous handlers for users i.e signup
 */
class UsersController {
  static async postNew(req: Request, res: Response) {
	//add new user
	const usr_det: string = req.body.emailpwd;
	if (!usr_det) {res.status(400).json({}); return;}
	const encoded_usr_str: string = (usr_det.split(" "))[1];
	const decoded_usr_str: string = Buffer.from(encoded_usr_str, 'base64').toString('utf-8');
	const usr_details: Array<string> = decoded_usr_str.split(':');
	const password: string = usr_details[1];
	const email: string = usr_details[0];
	if (!email) {
		res.status(400).json({"error": "Missing email"});
		return;
	}
	if (!password) {
		res.status(400).json({'error': 'Missing password'});
		return;
	}
	const user: any = await (await dbClient.client.db().collection('users'))
	.findOne({ "email": email });
	if (user) {
		res.status(401).json({'error': 'Already exist'});
		return;
	}
	const result: any = await (await dbClient.client.db().collection('users'))
	.insertOne({"email": email, "password": sha1(password), "first_name": '', "last_name": '', "phone": '', });
	const usrId: string = result.insertedId.toString();


	res.status(201).json({ "email": email });
  }

  static async getMe(req: Request, res: Response) {
	//check if user is logged in
  	const x_tok: string | string[] = req.headers['x-token'];
	if (!x_tok) { res.status(400).json({}); return;}
	const usr_id: any = await redisClient.get(`auth_${x_tok}`);
	if (!usr_id) {
		res.status(401).json({});
		return;
	}
	const user: any = await (await dbClient.client.db().collection('users'))
	.findOne({ "_id": ObjectID(usr_id) });
	if (!user) { res.status(401).json({}); return;}
	res.json({'email': user.email,
		'first_name': user.first_name, 'last_name': user.last_name,
		'phone': user.phone
	});
  }

  static async putUpdate(req: Request, res: Response) {
	//to update user information (first and last name and phone)
	const x_tok: string | string[] = req.headers['x-token'];
	if (!x_tok) { res.status(400).json(); return;}
	const usr_id: any = await redisClient.get(`auth_${x_tok}`);
	if (!usr_id) {
		res.status(401).json({"error": "Unauthorized"});
		return;
	}
	const user: any = await (await dbClient.client.db().collection('users'))
	.findOne({ "_id": ObjectID(usr_id) });
	if (!user) { res.status(400).json(); return;}
	const first_name: string = req.body.first_name;
	const last_name: string = req.body.last_name;
	const phone: string = req.body.phone;
	if (!first_name || !last_name || !phone) { res.status(400).json({"error": "missing data"}); return;}
	await (await dbClient.client.db().collection('users'))
		.updateOne({ "_id": ObjectID(usr_id) },
		{ $set: { "first_name": first_name, "last_name": last_name, "phone": phone} });
	res.status(200).json({"status": "ok"});
  }
}

export default UsersController;
module.exports = UsersController;

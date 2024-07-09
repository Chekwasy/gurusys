import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Queue from 'bull';
import { v4 } from 'uuid';
import { Request, Response } from 'express';
const fs = require('fs').promises;
const mime = require('mime-types');
const { promisify } = require('util');
const mkdirp = require('mkdirp');
const FS = require('fs');
const { ObjectID } = require('mongodb');
const path = process.env.FOLDER_PATH || '/tmp/blog_chekwasy';

/**
 * Contains files miscellanous handlers
 */
class FilesController {
	static async postUpload(req: Request, res: Response) {
		const x_tok: string | string[] = req.headers['x-token'];
		if (!x_tok) { res.json(); return;}
		const usr_id: any = await redisClient.get(`auth_${x_tok}`);
		if (!usr_id) {
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "_id": ObjectID(usr_id) });
		if (!user) { 
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		if (!req.body) { res.json(); return; }
		const name: string = req.body.name || null;
		const type: string = req.body.type || null;
		const parentId: string = req.body.parentId || '0';
		const isPublic: boolean = req.body.isPublic || false;
		let data: any = null;
		if (type && (type === 'file' || type === 'image')) { 
			data = req.body.data || null; }
		if (!name) {
			res.status(400).json({"error": "Missing name"});
			return;
		}
		if (!type) {
			res.status(400).json({"error": "Missing type"});
			return;
		}
		if (((type === 'image') || (type === 'file')) && !data) {
			res.status(400).json({"error": "Missing data"});
			return;
		}
		if (parseInt(req.body.parentId) === 0) {
			const file: any = await (await dbClient.client.db().collection('files'))
			.findOne({ "parentId": parentId.toString() });
			if (!file) {
				res.status(400).json({"error": "Parent not found"});
				return;
			}
			if (file.type !== 'folder') {
				res.status(400).json({"error": "Parent is not a folder"});
				return;
			}
		}
		if (type === 'folder' && name) {
			const saved_folder: any = await (await dbClient.client.db().collection('files'))
			.insertOne({ "userId": ObjectID(usr_id), "name": name,
			"type": type, "parentId": parentId.toString(), "isPublic": isPublic });

			res.status(201).json({"id": saved_folder.insertedId.toString(),
				"userId": usr_id, "name": name, "type": type,
				"isPublic": isPublic, "parentId": parentId });
			return;
		}
		const newFileName: string = v4();

		//Function to check if directory exists and creates it async
		const createDir = () => { return fs.mkdir(path, {recursive: true}); };

		//function to create file with name as uuid4 created and write to it async
		const writeInFile = async () => {
			try {
				await createDir();
				await fs.writeFile(`${path}/${newFileName}`, Buffer.from(data, 'base64'));
			}
			catch {
				console.log('Error writing file');
			}
		};
		// calling the function for doing both create dir and file writing
		await writeInFile();
		const saved_file = await (await dbClient.client.db().collection('files'))
			.insertOne({ "userId": ObjectID(usr_id), "name": name,
			"type": type, "parentId": parentId.toString(), "isPublic": isPublic,
			"localPath": path + '/' + newFileName });

		const file_id: string = saved_file.insertedId.toString();

		//creating file queue for image thumbnail
		if (type === 'image') {
		 const fileQueue = new Queue('create thumbnails');
		 const jobName = `Image thumbnail [${usr_id}-${file_id}]`
		 const bullJob = await fileQueue.add({"userId": usr_id, "fileId": file_id, "name": jobName});
		}

		res.status(201).json({"id": file_id,
				"userId": usr_id, "name": name, "type": type,
				"isPublic": isPublic, "parentId": parentId });
		return;
	}

	static async getShow(req: Request, res: Response) {
		const x_tok: string | string[] = req.headers['x-token'];
		if (!x_tok) { res.json(); return;}
		const usr_id: any = await redisClient.get(`auth_${x_tok}`);
		if (!usr_id) {
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "_id": ObjectID(usr_id) });
		if (!user) { 
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		const file_id: string = req.params.id || '';
		const file: any = await (await dbClient.client.db().collection('files'))
		.findOne({ "userId": ObjectID(usr_id), "_id": ObjectID(file_id) });
		if (!file) {
			res.status(404).json({"error": "Not found"});
			return;
		}
		res.json({"id": file._id, "userId": file.userId, "name": file.name,
			"type": file.type, "isPublic": file.isPublic, "parentId": file.parentId});
		return;
	}

	static async getIndex(req: Request, res: Response) {
		const x_tok: string | string[] = req.headers['x-token'];
		if (!x_tok) { res.json(); return;}
		const usr_id: any = await redisClient.get(`auth_${x_tok}`);
		if (!usr_id) {
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "_id": ObjectID(usr_id) });
		if (!user) { 
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		const parentId = req.query.parentId || '0';
		const page: any = req.query.page || '0';
		const page_limit = 20;
		const skip = parseInt(page) * 20;
		try {
			if (parentId !== '0') {
				const file_list: any = await (await dbClient.client.db().collection('files'))
				.aggregate([
				{ $match: { "userId": ObjectID(usr_id), "parentId": parentId } },
				{ $skip: skip },
				{ $limit: page_limit }
				]).toArray();
				res.json(file_list);
				return;
			} else {
				const file_list: any = await (await dbClient.client.db().collection('files'))
				.aggregate([
				{ $match: { "userId": ObjectID(usr_id) } },
				{ $skip: skip },
				{ $limit: page_limit }
				]).toArray();
				res.json(file_list);
				return;
			}
		}
		catch (err) {
			console.log("Error fetching files");
			res.json({});
			return;
		}
	}

	static async putPublish(req: Request, res: Response) {
		const x_tok: string | string[] = req.headers['x-token'];
		if (!x_tok) { res.json(); return;}
		const usr_id: any = await redisClient.get(`auth_${x_tok}`);
		if (!usr_id) {
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "_id": ObjectID(usr_id) });
		if (!user) { 
			res.status(401).json({"error": "Unauthorized"});
			return;
		}

		const file_id: string = req.params.id || "";
		const file: any = await (await dbClient.client.db().collection('files'))
		.findOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) });
		if (!file) { 
			res.status(404).json({"error": "Not found"});
			return;
		}
		await (await dbClient.client.db().collection('files'))
		.updateOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) },
			{ $set: { "isPublic": true } });
		res.json({"id": file._id, "userId": file.userId, "name": file.name,
			"type": file.type, "isPublic": true, "parentId": file.parentId});
		return;
	}

	static async putUnpublish(req: Request, res: Response) {
		const x_tok: string | string[] = req.headers['x-token'];
		if (!x_tok) { res.json(); return;}
		const usr_id: any = await redisClient.get(`auth_${x_tok}`);
		if (!usr_id) {
			res.status(401).json({"error": "Unauthorized"});
			return;
		}
		const user: any = await (await dbClient.client.db().collection('users'))
		.findOne({ "_id": ObjectID(usr_id) });
		if (!user) { 
			res.status(401).json({"error": "Unauthorized"});
			return;
		}

		const file_id: string = req.params.id || "";
		const file: any = await (await dbClient.client.db().collection('files'))
		.findOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) });
		if (!file) { 
			res.status(404).json({"error": "Not found"});
			return;
		}
		await (await dbClient.client.db().collection('files'))
		.updateOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) },
			{ $set: { "isPublic": false } });
		res.json({"id": file._id, "userId": file.userId, "name": file.name,
			"type": file.type, "isPublic": false, "parentId": file.parentId});
		return;
	}

	static async getFile(req: Request, res: Response) {
		const x_tok: string | string[] = req.headers['x-token'];
		let usr_id: any = '';
		if (x_tok) { 
			usr_id = await redisClient.get(`auth_${x_tok}`);
		}
		const file_id: string = req.params.id || '';
		const file: any = await (await dbClient.client.db().collection('files'))
		.findOne({ "_id": ObjectID(file_id) });
		if (!file) { 
			res.status(404).json({"error": "Not found"});
			return;
		}
		if (!(file.isPublic) && (!usr_id)) {
			res.status(404).json({"error": "Not found"});
			return;
		}
		if (file.type === 'folder') {
			res.status(400).json({"error": "A folder doesn't have content"});
			return;
		}

		const localPath = file.localPath;
		if (!localPath) {
			res.status(400).json({"error": "Path not found"});
			return;
		}

		//getting size parameter using req.query
		const size = req.query.size;
		if (size) {
			const localPath_size = localPath + `_${size.toString()}`;
			FS.access(localPath_size, FS.constants.F_OK, (err: any) => {
	        if (err) {
	            // File does not exist or is not accessible
	            res.status(404).json({"error": "Not found"});
	        } else {
	            // File exists
	            const mimeType = mime.lookup(file.name);
					    res.setHeader('Content-Type', mimeType || 'text/plain; charset=utf-8');
					  	res.status(200).sendFile(localPath_size);
	        }
	    });
		}
		else {
			FS.access(localPath, FS.constants.F_OK, (err: any) => {
	        if (err) {
	            // File does not exist or is not accessible
	            res.status(404).json({"error": "Not found"});
	        } else {
	            // File exists
	            const mimeType: any = mime.lookup(file.name);
					    res.setHeader('Content-Type', mimeType || 'text/plain; charset=utf-8');
					  	res.status(200).sendFile(localPath);
	        }
	    });
		}
	}
}

export default FilesController;
module.exports = FilesController;
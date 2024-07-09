import Queue from 'bull';
import dbClient from './utils/db';
const { ObjectID } = require('mongodb');
const nodemailer = require('nodemailer');
const thumbnail = require('image-thumbnail');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
//pass: ''
 
let transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: '@gmail.com',
		pass: ''
	}
});

interface thumbnaildata {
	fileId: string;
	userId: string;
}
interface tokendata {
	email: string;
	token: string;
}


//creating new queue with same queue name as in filecontroller file
const fileQueue = new Queue<thumbnaildata>('create thumbnails');
const tokenQueue = new Queue<tokendata>('Sending Token');


//processing the job for file thumbnail
fileQueue.process( async (job, done) => {
	const fileId: string = job.data.fileId;
	const userId: string = job.data.userId;
	if (!fileId) {
		throw new Error("Missing fileId");
	}
	if (!userId) {
		throw new Error("Missing userId");
	}

	//checking if userid and fileid exist in db
	const file = await (await dbClient.client.db().collection('files'))
	.findOne({ "_id": ObjectID(fileId), "userId": ObjectID(userId) });
	if (!file) { 
		throw new Error("File not found");
	}
	const imgPath = file.localPath;
	if (!imgPath) {
		throw new Error("Image path not found in db");
	}
	// To generate dir for storing thumbnails
	const pathList: Array<string> = imgPath.split('/');
	const pathLen: number = pathList.length - 1;
	let savePath: string = '';
	for (let val: number = 1; val < pathLen; val++) {
		savePath = savePath + '/' + pathList[val];
	}
	//dir for storing the thumbnails
	savePath = savePath + '/';

	const thumbnailSizes: Array<number> = [500, 250, 100];
	thumbnailSizes.forEach(async (size: number) => {
		const thumbnailPath: string = imgPath + `_${size}`;

		fs.access(thumbnailPath, fs.constants.F_OK, async (err: any) => {
			if (err) {
				//console.log('Processing');
				//generate the thumbnail for each of the size
				try {
					const thumbnailBuffer: any = await thumbnail(imgPath, {"width": size});
					fs.writeFileSync(thumbnailPath, thumbnailBuffer);
				} catch {
					throw new Error("Error creating thumbnail");
				}
			}
		});
	});
	done();
});

//job to send user token for password reset
tokenQueue.process(async (job, done) => {
	const email: string = job.data.email;
	const token: string = job.data.token;

	if (!email || !token) {
		throw new Error("Missing email or token");
	}
	//console.log('Processing', email);

	//Data of email to be sent
	let mailOptions: { [key: string]: string } = {
		from: 'bet.chekwasy@gmail.com',
		to: email,
		subject: 'Reset password token',
		html: `<div>
		<h2>Your reset password token is ${token},</h2>
		<p>Your password token will expire in 10minutes</>.
		<h2>bet.chekwasy.tech</h2>
		</div>`
	}
	transporter.sendMail(mailOptions, (err: any, info: any) => {
		if(err) {
			console.log(err);
		} else {
			console.log(info.response);
		}
	});
	done();
});
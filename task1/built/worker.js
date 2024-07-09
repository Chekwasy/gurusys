var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
//creating new queue with same queue name as in filecontroller file
const fileQueue = new Queue('create thumbnails');
const tokenQueue = new Queue('Sending Token');
//processing the job for file thumbnail
fileQueue.process((job, done) => __awaiter(void 0, void 0, void 0, function* () {
    const fileId = job.data.fileId;
    const userId = job.data.userId;
    if (!fileId) {
        throw new Error("Missing fileId");
    }
    if (!userId) {
        throw new Error("Missing userId");
    }
    //checking if userid and fileid exist in db
    const file = yield (yield dbClient.client.db().collection('files'))
        .findOne({ "_id": ObjectID(fileId), "userId": ObjectID(userId) });
    if (!file) {
        throw new Error("File not found");
    }
    const imgPath = file.localPath;
    if (!imgPath) {
        throw new Error("Image path not found in db");
    }
    // To generate dir for storing thumbnails
    const pathList = imgPath.split('/');
    const pathLen = pathList.length - 1;
    let savePath = '';
    for (let val = 1; val < pathLen; val++) {
        savePath = savePath + '/' + pathList[val];
    }
    //dir for storing the thumbnails
    savePath = savePath + '/';
    const thumbnailSizes = [500, 250, 100];
    thumbnailSizes.forEach((size) => __awaiter(void 0, void 0, void 0, function* () {
        const thumbnailPath = imgPath + `_${size}`;
        fs.access(thumbnailPath, fs.constants.F_OK, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                //console.log('Processing');
                //generate the thumbnail for each of the size
                try {
                    const thumbnailBuffer = yield thumbnail(imgPath, { "width": size });
                    fs.writeFileSync(thumbnailPath, thumbnailBuffer);
                }
                catch (_a) {
                    throw new Error("Error creating thumbnail");
                }
            }
        }));
    }));
    done();
}));
//job to send user token for password reset
tokenQueue.process((job, done) => __awaiter(void 0, void 0, void 0, function* () {
    const email = job.data.email;
    const token = job.data.token;
    if (!email || !token) {
        throw new Error("Missing email or token");
    }
    //console.log('Processing', email);
    //Data of email to be sent
    let mailOptions = {
        from: 'bet.chekwasy@gmail.com',
        to: email,
        subject: 'Reset password token',
        html: `<div>
		<h2>Your reset password token is ${token},</h2>
		<p>Your password token will expire in 10minutes</>.
		<h2>bet.chekwasy.tech</h2>
		</div>`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(info.response);
        }
    });
    done();
}));
//# sourceMappingURL=worker.js.map
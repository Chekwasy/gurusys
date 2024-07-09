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
import redisClient from '../utils/redis';
import Queue from 'bull/lib/queue';
import { v4 } from 'uuid';
const fs = require('fs').promises;
const mime = require('mime-types');
const { promisify } = require('util');
const mkdirp = require('mkdirp');
const FS = require('fs');
const { ObjectID } = require('mongodb');
const path = process.env.FOLDER_PATH || '/tmp/bet_chekwasy';
/**
 * Contains files miscellanous handlers
 */
class FilesController {
    static postUpload(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "_id": ObjectID(usr_id) });
            if (!user) {
                res.status(401).json({ "error": "Unauthorized" });
                return;
            }
            if (!req.body) {
                res.json();
                return;
            }
            const name = req.body.name || null;
            const type = req.body.type || null;
            const parentId = req.body.parentId || 0;
            const isPublic = req.body.isPublic || false;
            let data = null;
            if (type && (type === 'file' || type === 'image')) {
                data = req.body.data || null;
            }
            if (!name) {
                res.status(400).json({ "error": "Missing name" });
                return;
            }
            if (!type) {
                res.status(400).json({ "error": "Missing type" });
                return;
            }
            if (((type === 'image') || (type === 'file')) && !data) {
                res.status(400).json({ "error": "Missing data" });
                return;
            }
            if (req.body.parentId === 0) {
                const file = yield (yield dbClient.client.db().collection('files'))
                    .findOne({ "parentId": parentId.toString() });
                if (!file) {
                    res.status(400).json({ "error": "Parent not found" });
                    return;
                }
                if (file.type !== 'folder') {
                    res.status(400).json({ "error": "Parent is not a folder" });
                    return;
                }
            }
            if (type === 'folder' && name) {
                const saved_folder = yield (yield dbClient.client.db().collection('files'))
                    .insertOne({ "userId": ObjectID(usr_id), "name": name,
                    "type": type, "parentId": parentId.toString(), "isPublic": isPublic });
                res.status(201).json({ "id": saved_folder.insertedId.toString(),
                    "userId": usr_id, "name": name, "type": type,
                    "isPublic": isPublic, "parentId": parentId });
                return;
            }
            const newFileName = v4();
            //Function to check if directory exists and creates it async
            const createDir = () => { return fs.mkdir(path, { recursive: true }); };
            //function to create file with name as uuid4 created and write to it async
            const writeInFile = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield createDir();
                    yield fs.writeFile(`${path}/${newFileName}`, Buffer.from(data, 'base64'));
                }
                catch (_a) {
                    console.log('Error writing file');
                }
            });
            // calling the function for doing both create dir and file writing
            yield writeInFile();
            const saved_file = yield (yield dbClient.client.db().collection('files'))
                .insertOne({ "userId": ObjectID(usr_id), "name": name,
                "type": type, "parentId": parentId.toString(), "isPublic": isPublic,
                "localPath": path + '/' + newFileName });
            const file_id = saved_file.insertedId.toString();
            //creating file queue for image thumbnail
            if (type === 'image') {
                const fileQueue = new Queue('create thumbnails');
                const jobName = `Image thumbnail [${usr_id}-${file_id}]`;
                const bullJob = yield fileQueue.add({ "userId": usr_id, "fileId": file_id, "name": jobName });
            }
            res.status(201).json({ "id": file_id,
                "userId": usr_id, "name": name, "type": type,
                "isPublic": isPublic, "parentId": parentId });
            return;
        });
    }
    static getShow(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "_id": ObjectID(usr_id) });
            if (!user) {
                res.status(401).json({ "error": "Unauthorized" });
                return;
            }
            const file_id = req.params.id || '';
            const file = yield (yield dbClient.client.db().collection('files'))
                .findOne({ "userId": ObjectID(usr_id), "_id": ObjectID(file_id) });
            if (!file) {
                res.status(404).json({ "error": "Not found" });
                return;
            }
            res.json({ "id": file._id, "userId": file.userId, "name": file.name,
                "type": file.type, "isPublic": file.isPublic, "parentId": file.parentId });
            return;
        });
    }
    static getIndex(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "_id": ObjectID(usr_id) });
            if (!user) {
                res.status(401).json({ "error": "Unauthorized" });
                return;
            }
            const parentId = req.query.parentId || '0';
            const page = req.query.page || 0;
            const page_limit = 20;
            const skip = parseInt(page) * 20;
            try {
                if (parentId !== '0') {
                    const file_list = yield (yield dbClient.client.db().collection('files'))
                        .aggregate([
                        { $match: { "userId": ObjectID(usr_id), "parentId": parentId } },
                        { $skip: skip },
                        { $limit: page_limit }
                    ]).toArray();
                    res.json(file_list);
                    return;
                }
                else {
                    const file_list = yield (yield dbClient.client.db().collection('files'))
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
        });
    }
    static putPublish(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "_id": ObjectID(usr_id) });
            if (!user) {
                res.status(401).json({ "error": "Unauthorized" });
                return;
            }
            const file_id = req.params.id || "";
            const file = yield (yield dbClient.client.db().collection('files'))
                .findOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) });
            if (!file) {
                res.status(404).json({ "error": "Not found" });
                return;
            }
            yield (yield dbClient.client.db().collection('files'))
                .updateOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) }, { $set: { "isPublic": true } });
            res.json({ "id": file._id, "userId": file.userId, "name": file.name,
                "type": file.type, "isPublic": true, "parentId": file.parentId });
            return;
        });
    }
    static putUnpublish(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const user = yield (yield dbClient.client.db().collection('users'))
                .findOne({ "_id": ObjectID(usr_id) });
            if (!user) {
                res.status(401).json({ "error": "Unauthorized" });
                return;
            }
            const file_id = req.params.id || "";
            const file = yield (yield dbClient.client.db().collection('files'))
                .findOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) });
            if (!file) {
                res.status(404).json({ "error": "Not found" });
                return;
            }
            yield (yield dbClient.client.db().collection('files'))
                .updateOne({ "_id": ObjectID(file_id), "userId": ObjectID(usr_id) }, { $set: { "isPublic": false } });
            res.json({ "id": file._id, "userId": file.userId, "name": file.name,
                "type": file.type, "isPublic": false, "parentId": file.parentId });
            return;
        });
    }
    static getFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const x_tok = req.headers['x-token'];
            if (x_tok) {
                const usr_id = yield redisClient.get(`auth_${x_tok}`);
            }
            const file_id = req.params.id || '';
            const file = yield (yield dbClient.client.db().collection('files'))
                .findOne({ "_id": ObjectID(file_id) });
            if (!file) {
                res.status(404).json({ "error": "Not found" });
                return;
            }
            if (!(file.isPublic) && (!usr_id)) {
                res.status(404).json({ "error": "Not found" });
                return;
            }
            if (file.type === 'folder') {
                res.status(400).json({ "error": "A folder doesn't have content" });
                return;
            }
            const localPath = file.localPath;
            if (!localPath) {
                res.status(400).json({ "error": "Path not found" });
                return;
            }
            //getting size parameter using req.query
            const size = req.query.size;
            if (size) {
                const localPath_size = localPath + `_${size.toString()}`;
                FS.access(localPath_size, FS.constants.F_OK, (err) => {
                    if (err) {
                        // File does not exist or is not accessible
                        res.status(404).json({ "error": "Not found" });
                    }
                    else {
                        // File exists
                        const mimeType = mime.lookup(file.name);
                        res.setHeader('Content-Type', mimeType || 'text/plain; charset=utf-8');
                        res.status(200).sendFile(localPath_size);
                    }
                });
            }
            else {
                FS.access(localPath, FS.constants.F_OK, (err) => {
                    if (err) {
                        // File does not exist or is not accessible
                        res.status(404).json({ "error": "Not found" });
                    }
                    else {
                        // File exists
                        const mimeType = mime.lookup(file.name);
                        res.setHeader('Content-Type', mimeType || 'text/plain; charset=utf-8');
                        res.status(200).sendFile(localPath);
                    }
                });
            }
        });
    }
}
export default FilesController;
module.exports = FilesController;
//# sourceMappingURL=FilesController.js.map
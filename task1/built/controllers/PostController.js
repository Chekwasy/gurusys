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
const { ObjectID } = require('mongodb');
import dbClient from '../utils/db';
/**
 * Contains auth miscellanous handlers for games collection
 */
class PostsController {
    static getPosts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //get games of a particular date as parameter
            let posts = yield (yield dbClient.client.db().collection('posts'))
                .find();
            if (posts) {
                res.status(200).json({ "posts": posts });
                return;
            }
            res.status(400).json({ "error": "no result" });
        });
    }
    static postPost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //post a new bet that is played
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
            const postTitle = req.body.postTitle;
            const postTime = req.body.postTime;
            const postBody = req.body.postBody;
            if (!postTitle || !postTime || !postBody) {
                res.status(400).json({});
                return;
            }
            const result = yield (yield dbClient.client.db().collection('posts'))
                .insertOne({ "userId": user._id, "postTitle": postTitle,
                "postTime": postTime, "postBody": postBody, "editTime": '', "edited": false
            });
            const postid = result.insertedId.toString();
            res.status(200).json({ "postid": postid, "userId": user._id });
        });
    }
    static putPost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const postId = req.body.postId;
            const editTime = req.body.editTime;
            const postTitle = req.body.postTitle;
            const postBody = req.body.postBody;
            if (!postId || !editTime || postTitle || postBody) {
                res.status(400).json({});
                return;
            }
            const pt = yield (yield dbClient.client.db().collection('posts'))
                .findOne({ "_id": ObjectID(postId) });
            if (!pt) {
                res.status(400).json({ "error": "post not found" });
                return;
            }
            if (pt.userId === user._id) {
                yield (yield dbClient.client.db().collection('posts'))
                    .updateOne({ "_id": ObjectID(postId) }, { $set: { "postTitle": postTitle, "postBody": postBody, "editTime": editTime, "edited": true } });
                res.status(200).json({ "res": "edited" });
                return;
            }
            res.status(400).json({ "error": "not your post" });
        });
    }
    static deletePost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const postId = req.body.postId;
            if (!postId) {
                res.status(400).json({});
                return;
            }
            const pt = yield (yield dbClient.client.db().collection('posts'))
                .findOne({ "_id": ObjectID(postId) });
            if (!pt) {
                res.status(400).json({ "error": "post not found" });
                return;
            }
            if (pt.userId === user._id) {
                yield (yield dbClient.client.db().collection('posts'))
                    .deleteOne({ "_id": ObjectID(postId) });
                res.json({});
                return;
            }
            res.status(400).json({ "error": "not your post" });
        });
    }
}
export default PostsController;
module.exports = PostsController;
//# sourceMappingURL=PostController.js.map
import redisClient from '../utils/redis';
import { v4 } from 'uuid';
const { ObjectID } = require('mongodb');
import { Request, Response } from 'express';


import dbClient from '../utils/db';
/**
 * Contains auth miscellanous handlers for games collection
 */
class PostsController {
    static async getPosts(req: Request, res: Response) {
        //get games of a particular date as parameter
        let posts: any = await (await dbClient.client.db().collection('posts'))
        .find();
        if (posts) {
            res.status(200).json({"posts": posts});
            return;            
        }
	    res.status(400).json({"error": "no result"});
    }


    static async postPost(req: Request, res: Response) {
        //post a new bet that is played
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

        const postTitle: string = req.body.postTitle;
        const postTime: string = req.body.postTime;
        const postBody: string = req.body.postBody;
        if (!postTitle || !postTime || !postBody) {res.status(400).json({}); return;}
        const result = await (await dbClient.client.db().collection('posts'))
	    .insertOne({"userId": user._id, "postTitle": postTitle,
	    "postTime": postTime, "postBody": postBody, "editTime": '', "edited": false
        });
	    const postid = result.insertedId.toString();
        res.status(200).json({"postid": postid, "userId": user._id});
    }


    static async putPost(req: Request, res: Response) {
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
        const postId: string = req.body.postId;
        const editTime: string = req.body.editTime;
        const postTitle: string = req.body.postTitle;
        const postBody: string = req.body.postBody;
        if (!postId || !editTime || postTitle || postBody) {res.status(400).json({}); return;}
        
        const pt: any = await (await dbClient.client.db().collection('posts'))
        .findOne({ "_id": ObjectID(postId) });
        if (!pt) {res.status(400).json({"error": "post not found"}); return;}

        if (pt.userId === user._id) {
            await (await dbClient.client.db().collection('posts'))
            .updateOne({ "_id": ObjectID(postId) },
            { $set: { "postTitle": postTitle, "postBody": postBody, "editTime": editTime, "edited": true} });
            res.status(200).json({"res": "edited"}); return;
        }
        res.status(400).json({"error": "not your post"});
    }


    static async deletePost(req: Request, res: Response) {
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
        const postId: string = req.body.postId;
        if (!postId) {res.status(400).json({}); return;}

        const pt: any = await (await dbClient.client.db().collection('posts'))
        .findOne({ "_id": ObjectID(postId) });
        if (!pt) {res.status(400).json({"error": "post not found"}); return;}
        
        if (pt.userId === user._id) {
            await (await dbClient.client.db().collection('posts'))
            .deleteOne({ "_id": ObjectID(postId) });
            res.json({}); return;
        }
        res.status(400).json({"error": "not your post"});
    }
}


export default PostsController;
module.exports = PostsController;
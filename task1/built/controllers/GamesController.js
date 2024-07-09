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
class GamesController {
    static getGames(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //get games of a particular date as parameter
            const date = req.params.date;
            if (!date) {
                res.status(400).json({});
                return;
            }
            if (date.length !== 8) {
                res.status(400).json({});
                return;
            }
            //check if date supplied is in range
            let today = new Date();
            for (let i = 0; i < 8; i++) {
                const nex = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000));
                let dateLst = nex.toLocaleDateString().split('/');
                if (dateLst[0].length === 1) {
                    dateLst[0] = '0' + dateLst[0];
                }
                if (dateLst[1].length === 1) {
                    dateLst[1] = '0' + dateLst[1];
                }
                let date_ = dateLst[2] + dateLst[0] + dateLst[1];
                if (date === date_) {
                    let getDate = yield (yield dbClient.client.db().collection('dates'))
                        .findOne({ "date": date_ });
                    if (getDate) {
                        res.status(200).json({ "games": getDate.games });
                        return;
                    }
                }
            }
            res.status(400).json({ "error": "Date not in range" });
        });
    }
    static postBet(req, res) {
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
            const stakeAmt = req.body.stakeAmt;
            const betTime = req.body.betTime;
            const gameStatus = req.body.gameStatus;
            const outcome = req.body.outcome;
            const totalOdd = req.body.totalOdd;
            const expReturns = req.body.expReturns;
            const games = req.body.games;
            if (parseFloat(stakeAmt) > parseFloat(user.account_balance)) {
                res.status(400).json({ 'error': 'balance insufficient' });
                return;
            }
            if (!stakeAmt || !betTime || !gameStatus || !outcome
                || !totalOdd || !expReturns || !games) {
                res.status(400).json({});
                return;
            }
            const result = yield (yield dbClient.client.db().collection('games'))
                .insertOne({ "userId": user._id, "stakeAmt": stakeAmt,
                "betTime": betTime, "gameStatus": gameStatus, "outcome": outcome,
                "totalOdd": totalOdd, "expReturns": expReturns,
                "games": games
            });
            const gameId = result.insertedId.toString();
            res.status(200).json({ "gameId": gameId, "userId": user._id });
        });
    }
    static getOpenbet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //get open bets for a user with pagination
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
            const page = parseInt(req.params.pg);
            if (isNaN(page)) {
                res.status(400).json({ "error": "wrong page value" });
            }
            if (!page) {
                res.status(400).json({});
                return;
            }
            let count = 0;
            if (page === 1) {
                const count = yield (yield dbClient.client.db().collection('games'))
                    .countDocuments({ "userId": ObjectID(usr_id), "gameStatus": 'open' });
            }
            const pageSize = 10;
            const skip = (page - 1) * pageSize;
            const opengames = yield (yield dbClient.client.db().collection('games'))
                .find({ "userId": ObjectID(usr_id), "gameStatus": 'open' }).sort({ _id: -1 }).skip(skip).limit(pageSize).toArray();
            res.status(200).json({ "count": count, "opengames": opengames });
        });
    }
    static getClosebet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //get closed bets for a user with pagination
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
            const page = parseInt(req.params.pg);
            if (isNaN(page)) {
                res.status(400).json({ "error": "wrong page value" });
            }
            if (!page) {
                res.status(400).json({});
                return;
            }
            let count = 0;
            if (page === 1) {
                count = yield (yield dbClient.client.db().collection('games'))
                    .countDocuments({ "userId": ObjectID(usr_id), "gameStatus": 'close' });
            }
            const pageSize = 10;
            const skip = (page - 1) * pageSize;
            const closegames = yield (yield dbClient.client.db().collection('games'))
                .find({ "userId": ObjectID(usr_id), "gameStatus": 'close' }).sort({ _id: -1 }).skip(skip).limit(pageSize).toArray();
            res.status(200).json({ "count": count, "closegames": closegames });
        });
    }
    static getOdds(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //get game odds of a particular date as parameter
            const date = req.params.date;
            if (!date) {
                res.status(400).json({});
                return;
            }
            if (date.length !== 8) {
                res.status(400).json({});
                return;
            }
            //check if date supplied is in range
            let today = new Date();
            for (let i = 0; i < 8; i++) {
                const nex = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000));
                let dateLst = nex.toLocaleDateString().split('/');
                if (dateLst[0].length === 1) {
                    dateLst[0] = '0' + dateLst[0];
                }
                if (dateLst[1].length === 1) {
                    dateLst[1] = '0' + dateLst[1];
                }
                let date_ = dateLst[2] + dateLst[0] + dateLst[1];
                if (date === date_) {
                    let getOdds = yield (yield dbClient.client.db().collection('odds'))
                        .findOne({ "date": date_ });
                    if (getOdds) {
                        res.status(200).json({ "odds": getOdds.odds });
                        return;
                    }
                }
            }
            res.status(400).json({ "error": "Date not in range" });
        });
    }
    static postOdds(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            //post odds. for admin only
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
            if (user.email !== 'richardchekwas@gmail.com') {
                res.status(403).json({ 'error': 'Access completely denied' });
                return;
            }
            const date = req.params.date;
            const odds = req.body.odds;
            if (!date || !odds) {
                res.status(400).json({});
                return;
            }
            //sample of odds [{Eid, homeodd, awayodd, drawodd} ...]
            for (let i = 0; i < 8; i++) {
                const nex = new Date(today.getTime() + (i * 24 * 60 * 60 * 1000));
                let dateLst = nex.toLocaleDateString().split('/');
                if (dateLst[0].length === 1) {
                    dateLst[0] = '0' + dateLst[0];
                }
                if (dateLst[1].length === 1) {
                    dateLst[1] = '0' + dateLst[1];
                }
                let date_ = dateLst[2] + dateLst[0] + dateLst[1];
                if (date === date_) {
                    let getOdds = yield (yield dbClient.client.db().collection('odds'))
                        .findOne({ "date": date });
                    const oddsLen = odds.length;
                    for (let i = 0; i < oddsLen; i++) {
                        let Eid = odds[i].Eid;
                        getOdds.odds[0].Eid[0].homeodd = odds[i].homeodd;
                        getOdds.odds[0].Eid[0].awayodd = odds[i].awayodd;
                        getOdds.odds[0].Eid[0].drawodd = odds[i].drawodd;
                    }
                    yield (yield dbClient.client.db().collection('odds'))
                        .replaceOne({ "date": date }, getOdds);
                    res.status(200).json({ "status": "ok" });
                    return;
                }
            }
            res.json({});
            return;
        });
    }
    static getSavedgames(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_ = req.params.id;
            if (!id_) {
                res.status(400).json({});
                return;
            }
            const savdgm = yield redisClient.get(id_);
            if (!savdgm) {
                res.status(200).json({ "savedgames": {} });
                return;
            }
            //console.log(savdgm);
            res.status(200).json({ "savedgames": JSON.parse(savdgm) });
        });
    }
    static postSavedgames(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const id_ = req.body.id_;
            const data = req.body.savedgames;
            if (!id_ || !data) {
                res.json({});
                return;
            }
            redisClient.set(id_, JSON.stringify(data), 24 * 60 * 60);
            res.status(200).json({ "status": "ok" });
        });
    }
}
export default GamesController;
module.exports = GamesController;
//# sourceMappingURL=GamesController.js.map
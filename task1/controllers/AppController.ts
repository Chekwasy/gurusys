import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { Request, Response } from 'express';

/**
 * Contains the miscellanous handlers for site stability
 */
class AppController {
  static async getStatus(req: Request, res: Response) {
	//get status of redis server and database if its working
  	let val1: boolean = false;
  	let val2: boolean = false;
  	val1 = redisClient.isAlive();
   	val2 = await dbClient.isAlive();
   	if (val1 && val2) {
    	res.status(200).json({ "redis": true, "db": true });
    }
  }

  static getStats(req: Request, res: Response) {
	//get total users and files currently
  	if (dbClient.isAlive()) {
  		let val1: number = 0;
  		let val2: number = 0;
		let val3: number = 0;
	  	(async () => {
	  		val1 = await dbClient.nbUsers();
	   		val2 = await dbClient.nbFiles();
			val3 = await dbClient.nbBlog();
	   	})();
    	res.status(200).json({ "users": val1, "files": val2, "games": val3 });
	}
  }
}

export default AppController;
module.exports = AppController;
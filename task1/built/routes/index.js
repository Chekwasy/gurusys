import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import GamesController from '../controllers/GamesController';
const cors = require('cors');
const bodyParser = require('body-parser');
const mapRoute = (app) => {
    app.use(cors({
        origin: '*'
    }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.get('/api/v1/status', AppController.getStatus);
    app.get('/api/v1/stats', AppController.getStats);
    app.post('/api/v1/users', UsersController.postNew);
    app.get('/api/v1/connect', AuthController.getConnect);
    app.get('/api/v1/disconnect', AuthController.getDisconnect);
    app.get('/api/v1/users/me', UsersController.getMe);
    app.post('/api/v1/files', FilesController.postUpload);
    app.get('/api/v1/files/:id', FilesController.getShow);
    app.get('/api/v1/files', FilesController.getIndex);
    app.put('/api/v1/files/:id/publish', FilesController.putPublish);
    app.put('/api/v1/files/:id/unpublish', FilesController.putUnpublish);
    app.get('/api/v1/files/:id/data', FilesController.getFile);
    app.get('/api/v1/games/:date', GamesController.getGames);
    app.get('/api/v1/odds/:date', GamesController.getOdds);
    app.put('/api/v1/bal_res', UsersController.putBalance);
    app.post('/api/v1/send_tok', AuthController.postSend_tok);
    app.post('/api/v1/pwdreset', AuthController.postPwdreset);
    app.post('/api/v1/checktoken', AuthController.postChecktoken);
    app.put('/api/v1/update', UsersController.putUpdate);
    app.post('/api/v1/bet', GamesController.postBet);
    app.get('/api/v1/openbet/:pg', GamesController.getOpenbet);
    app.get('/api/v1/closebet/:pg', GamesController.getClosebet);
    app.post('/api/v1/postodds/:date', GamesController.postOdds);
    app.get('/api/v1/savedgames/:id', GamesController.getSavedgames);
    app.post('/api/v1/savedgames/', GamesController.postSavedgames);
};
export default mapRoute;
module.exports = mapRoute;
//# sourceMappingURL=index.js.map
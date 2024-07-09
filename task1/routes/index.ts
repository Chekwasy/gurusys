import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import PostsController from '../controllers/PostController';
const cors = require('cors');
const bodyParser = require('body-parser');


const mapRoute = (app: any) => {
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
  app.get('/api/v1/post', PostsController.getPosts);
  app.put('/api/v1/post', PostsController.putPost);
  app.post('/api/v1/send_tok', AuthController.postSend_tok);
  app.post('/api/v1/pwdreset', AuthController.postPwdreset);
  app.post('/api/v1/checktoken', AuthController.postChecktoken);
  app.put('/api/v1/update', UsersController.putUpdate);
  app.post('/api/v1/post', PostsController.postPost);
  app.delete('/api/v1/post', PostsController.deletePost);
};

export default mapRoute;
module.exports = mapRoute;

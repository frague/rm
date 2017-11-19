import Comment from '../models/comment';
import BaseCtrl from './base';

export default class CommentCtrl extends BaseCtrl {
  model = Comment;
}

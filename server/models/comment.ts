import * as mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  login: String,
  date: Date,
  text: String
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

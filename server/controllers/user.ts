import * as jwt from 'jsonwebtoken';

import User from '../models/user';
import BaseCtrl from './base';

export default class UserCtrl extends BaseCtrl {
  model = User;

  login = (req, res) => {
    let {email, password} = req.body;
    this.model.findOne({ email }, (err, user) => {
      if (!user) {
        return res.sendStatus(403);
      }
      user.comparePassword(password, (error, isMatch) => {
        if (!isMatch) {
          return res.sendStatus(403);
        }
        const token = jwt.sign({ user }, process.env.SECRET_TOKEN); // , { expiresIn: 10 } seconds
        res.json({ token });
      });
    });
  }

}

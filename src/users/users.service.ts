import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.userModel.findOne({ email: normalized }).exec();
  }

  async findById(userId: Types.ObjectId | string) {
    return this.userModel.findById(userId).exec();
  }

  async create(userData: { nickname: string; email: string; passwordHash: string }) {
    const user = new this.userModel(userData);
    return user.save();
  }
}

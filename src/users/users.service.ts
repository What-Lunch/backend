import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // 이메일로 유저 조회
  findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.userModel.findOne({ email: normalized }).exec();
  }

  // ID로 유저 조회
  async findById(userId: Types.ObjectId | string) {
    return this.userModel.findById(userId).exec();
  }

  // 회원 생성
  async create(userData: { nickname: string; email: string; passwordHash: string }) {
    const user = new this.userModel(userData);
    return user.save();
  }

  // 유저 정보 업데이트
  async updateById(userId: Types.ObjectId | string, updateData: Partial<User>) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }, // 업데이트된 문서 반환
    );

    if (!updatedUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return updatedUser;
  }
}

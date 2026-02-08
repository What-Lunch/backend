import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

export type UserUpdateData = {
  nickname?: string;
  passwordHash?: string;
  profileImage?: string | null;
};

const MAX_FOOD_DOTS = 9;

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
  findById(userId: Types.ObjectId | string) {
    return this.userModel.findById(userId).exec();
  }

  // 회원 생성
  async create(userData: {
    nickname: string;
    email: string;
    passwordHash?: string;
    profileImage?: string | null;
  }) {
    const user = new this.userModel(userData);
    return user.save();
  }

  // 유저 정보 업데이트
  async updateById(userId: Types.ObjectId | string, updateData: UserUpdateData) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return updatedUser;
  }

  // 내 음식 도트 목록 조회
  async getMyFoodDots(userId: Types.ObjectId | string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('selectedFoodDotIds');

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user.selectedFoodDotIds ?? [];
  }

  // 음식 도트 추가
  async addFoodDot(userId: Types.ObjectId | string, dotId: string): Promise<string[]> {
    const updatedUser = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        $expr: {
          $lt: [{ $size: { $ifNull: ['$selectedFoodDotIds', []] } }, MAX_FOOD_DOTS],
        },
      },
      {
        $addToSet: { selectedFoodDotIds: dotId },
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      const exists = await this.userModel.exists({ _id: userId });

      if (!exists) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      throw new BadRequestException(`음식 도트는 최대 ${MAX_FOOD_DOTS}개까지 선택할 수 있습니다`);
    }

    return updatedUser.selectedFoodDotIds ?? [];
  }

  // 음식 도트 제거
  async removeFoodDot(userId: Types.ObjectId | string, dotId: string): Promise<string[]> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $pull: { selectedFoodDotIds: dotId },
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return updatedUser.selectedFoodDotIds ?? [];
  }
}

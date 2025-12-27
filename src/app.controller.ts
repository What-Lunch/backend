import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(private readonly usersService: UsersService) {}

  @Get('debug/user')
  async debugUser(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { found: false };

    return {
      found: true,
      user: {
        id: String(user._id),
        email: user.email,
        nickname: user.nickname,
      },
    };
  }
}

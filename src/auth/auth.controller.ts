import { Controller, Post, Put, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-customer')
  @HttpCode(HttpStatus.CREATED)
  async registerCustomer(@Body() body: any) {
    return this.authService.registerCustomer(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  // 🆕 Add the HTTP PUT gateway here!
  @Put('profile/:id')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Param('id') id: string, @Body() body: { name: string; phone: string }) {
    return this.authService.updateProfile(id, body);
  }

  @Post('register-dealer')
async registerDealer(@Body() dto: any) {
  // This forwards the incoming form data directly to your registration service logic
  return await this.authService.registerDealer(dto);
}
}
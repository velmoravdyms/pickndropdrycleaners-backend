// import { Controller, Post, Put, Body, Param, HttpCode, HttpStatus,Get,Query,Res } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import type { Response } from 'express'; // 👈 Import Express Response
// import { PrismaService } from '../prisma/prisma.service'; // 👈 Adjust path to your PrismaService


  
// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService,prisma: PrismaService) {}

//       @Post('register-customer')
//       @HttpCode(HttpStatus.CREATED)
//       async registerCustomer(@Body() body: any) {
//         return this.authService.registerCustomer(body);
//       }

//       @Post('login')
//       @HttpCode(HttpStatus.OK)
//       async login(@Body() body: any) {
//         return this.authService.login(body);
//       }

//         @Post('forgot-password')
//       @HttpCode(HttpStatus.OK)
//       async forgotPassword(@Body('email') email: string) {
//         return this.authService.forgotPassword(email);
//       }


//       // 🆕 Add the HTTP PUT gateway here!
//       @Put('profile/:id')
//       @HttpCode(HttpStatus.OK)
//       async updateProfile(@Param('id') id: string, @Body() body: { name: string; phone: string }) {
//         return this.authService.updateProfile(id, body);
//       }

//         @Post('register-dealer')
//       async registerDealer(@Body() dto: any) {
//         // This forwards the incoming form data directly to your registration service logic
//         return await this.authService.registerDealer(dto);
//       }


//       // @Get('verify-email')
//       //   async verifyEmail(@Query('userId') userId: string) {
//       //     return this.authService.verifyEmail(userId);
//       // }


//       @Get('verify-email')
//       async verifyEmail(@Query('userId') userId: string,@Res() res: Response) {
//         const frontendLoginUrl = 'https://naipickndroplaundrycleaners.velmoragrouphub.com/#/login';

//         if (!userId) {
//           return res.status(400).send(`
//             <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
//               <h2 style="color: #d9534f;">❌ Verification Failed</h2>
//               <p>Invalid verification link. Missing User ID.</p>
//             </div>
//           `);
//         }

//         try {
//           const customer = await this.authService.customer.findUnique({ where: { id: userId } });

//           if (!customer) {
//             return res.status(404).send(`
//               <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
//                 <h2 style="color: #d9534f;">❌ Account Not Found</h2>
//                 <p>We could not find an account associated with this verification link.</p>
//               </div>
//             `);
//           }

//           // Update user in DB
//           await this.authService.customer.update({
//             where: { id: userId },
//             data: { isEmailVerified: true },
//           });

//           // Send styled success page
//           return res.send(`
//             <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; max-width: 500px; margin: auto;">
//               <div style="font-size: 60px; color: #4BB543;">✓</div>
//               <h2 style="color: #333;">Email Verified Successfully!</h2>
//               <p style="color: #666; margin-bottom: 30px;">Your account for <b>NaiPick & Drop Laundry</b> is active. You can now log in.</p>
//               <a href="${frontendLoginUrl}" style="background-color: #99326c; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Proceed to Login</a>
//             </div>
//           `);
//         } catch (err) {
//           return res.status(500).send(`
//             <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
//               <h2 style="color: #d9534f;">❌ Server Error</h2>
//               <p>Something went wrong during verification. Please try again later.</p>
//             </div>
//           `);
//         }
//       }

      
// }



import { Controller, Post, Put, Body, Param, HttpCode, HttpStatus, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService, // 👈 Fixed: Added 'private readonly' so 'this.prisma' works
  ) {}

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

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
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

  // @Get('verify-email')
  // async verifyEmail(@Query('userId') userId: string, @Res() res: Response) {
  //   const frontendLoginUrl = 'https://naipickndroplaundrycleaners.velmoragrouphub.com/#/login';

  //   if (!userId) {
  //     return res.status(400).send(`
  //       <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
  //         <h2 style="color: #d9534f;">❌ Verification Failed</h2>
  //         <p>Invalid verification link. Missing User ID.</p>
  //       </div>
  //     `);
  //   }

  //   try {
  //     // 💡 Fixed: Uses this.prisma instead of this.authService
  //     const customer = await this.prisma.customer.findUnique({ where: { id: userId } });

  //     if (!customer) {
  //       return res.status(404).send(`
  //         <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
  //           <h2 style="color: #d9534f;">❌ Account Not Found</h2>
  //           <p>We could not find an account associated with this verification link.</p>
  //         </div>
  //       `);
  //     }

  //     // Update user in DB
  //     await this.prisma.customer.update({
  //       where: { id: userId },
  //       data: { isEmailVerified: true },
  //     });

  //     // Send styled success page
  //     return res.send(`
  //       <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; max-width: 500px; margin: auto;">
  //         <div style="font-size: 60px; color: #4BB543;">✓</div>
  //         <h2 style="color: #333;">Email Verified Successfully!</h2>
  //         <p style="color: #666; margin-bottom: 30px;">Your account for <b>NaiPick & Drop Laundry</b> is active. You can now log in.</p>
  //         <a href="${frontendLoginUrl}" style="background-color: #99326c; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Proceed to Login</a>
  //       </div>
  //     `);
  //   } catch (err) {
  //     return res.status(500).send(`
  //       <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
  //         <h2 style="color: #d9534f;">❌ Server Error</h2>
  //         <p>Something went wrong during verification. Please try again later.</p>
  //       </div>
  //     `);
  //   }
  // }


  @Get('verify-email')
  async verifyEmail(@Query('userId') userId: string, @Res() res: Response) {
    if (!userId) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #d9534f;">❌ Verification Failed</h2>
          <p>Invalid verification link. Missing User ID.</p>
        </div>
      `);
    }

    try {
      const customer = await this.prisma.customer.findUnique({ where: { id: userId } });

      if (!customer) {
        return res.status(404).send(`
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #d9534f;">❌ Account Not Found</h2>
            <p>We could not find an account associated with this verification link.</p>
          </div>
        `);
      }

      // 1. Mark account as verified in DB
      await this.prisma.customer.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      });

      // 2. Build Auto-Login & App Download URLs
      // 💡 Replace with your real token generator if using JWT
      const mockToken = `mock-jwt-token-for-${customer.id}`; 
      
      // Auto-login URL passes token & details straight to Flutter Web
      const autoLoginWebUrl = `https://naipickndroplaundrycleaners.velmoragrouphub.com/#/autologin?token=${mockToken}&userId=${customer.id}&email=${encodeURIComponent(customer.email)}&name=${encodeURIComponent(customer.name || '')}`;
      
      // Direct link to your hosted APK for Android users
      const appDownloadUrl = `https://naipickndroplaundrycleaners.velmoragrouphub.com/download/app.apk`;

      // 3. Send HTML response with Auto-Login + Download options
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verified - NaiPick & Drop</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #f9f9f9; margin: 0;">
          <div style="max-width: 480px; margin: auto; background: white; padding: 35px 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <div style="font-size: 55px; color: #4BB543; margin-bottom: 10px;">✓</div>
            <h2 style="color: #333; margin: 0 0 10px 0;">Email Verified Successfully!</h2>
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 25px;">
              Your account for <b>NaiPick & Drop Laundry</b> is active.
            </p>

            <a href="${autoLoginWebUrl}" style="background-color: #99326c; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: block; font-size: 15px; margin-bottom: 15px;">
              ⚡ Proceed to My Account (Auto Login)
            </a>

            <div style="border-top: 1px solid #eee; margin-top: 25px; padding-top: 20px;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #777;">Prefer using our Android mobile app?</p>
              <a href="${appDownloadUrl}" style="background-color: #333333; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">
                📲 Download Mobile App (APK)
              </a>
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      return res.status(500).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #d9534f;">❌ Server Error</h2>
          <p>Something went wrong during verification. Please try again later.</p>
        </div>
      `);
    }
  }
}
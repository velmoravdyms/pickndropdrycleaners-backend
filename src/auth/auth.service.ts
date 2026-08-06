

import { Injectable, BadRequestException, UnauthorizedException,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt'; 
import * as nodemailer from 'nodemailer';


// import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import dns from 'node:dns';// Force Node to prioritize IPv4 over IPv6 globally
dns.setDefaultResultOrder('ipv4first'); 



@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  

async registerCustomer(dto: any) {
    let existingUser: any = null;

    // 1. Check if email already exists with error handling for DB timeouts
    try {
      existingUser = await this.prisma.customer.findUnique({
        where: { email: dto.email },
      });
    } catch (dbError) {
      console.error('Database connection error during customer registration:', dbError);
      throw new BadRequestException('Database connection timed out. Please try again.');
    }

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    // 🎯 Extract name from email prefix (e.g., "john.doe" from "john.doe@gmail.com")
    const fallbackName = dto.email ? dto.email.split('@')[0] : 'Valued Customer';
    const customerName = dto.name || fallbackName;

    // 2. Create the new customer row safely
    let newCustomer: any = null;
    try {
      newCustomer = await this.prisma.customer.create({
        data: {
          name: customerName, 
          email: dto.email,
          phone: dto.phone,
          password: dto.password, 
          isEmailVerified: false,
        },
      });
    } catch (createError) {
      console.error('Error creating customer record:', createError);
      throw new BadRequestException('Failed to create account. Please try again.');
    }

    console.log('NEW CUSTOMER ENTITY:', newCustomer);

    // 3. Dispatch verification email & catch email dispatch errors
    try {
      await this.sendVerificationEmail(
        newCustomer.id,
        newCustomer.email,
        newCustomer.name ?? fallbackName,
      );
    } catch (emailErr) {
      console.error('FAILED TO SEND VERIFICATION EMAIL:', emailErr);
      console.log('Account created, but failed to send verification email. Please check server credentials.');
     // Development Fallback: Print link directly to terminal so you can test manually!
      console.log(
        //`🔗 [DEV VERIFICATION LINK]: http://localhost:3000/api/auth/verify?token=${newCustomer.verificationToken}`
        `🔗 [DEV VERIFICATION LINK]: https://pickndropdrycleaners-backend.onrender.com/api/auth/verify?token=${newCustomer.verificationToken}`

      );
    }


    // 4. Return success response
    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      id: newCustomer.id,
    };
  }



  async login(dto: any) {
    let userEntity: any = null;
    let userRole = 'CUSTOMER';

    // 1. Fetch user entity safely with error handling for DB timeouts
    try {
      userEntity = await this.prisma.customer.findUnique({
        where: { email: dto.email },
      });

      if (!userEntity) {
        userEntity = await this.prisma.laundryShop.findUnique({
          where: { email: dto.email },
        });
        userRole = 'DEALER';
      }
    } catch (dbError) {
      console.error('Database connection error during login:', dbError);
      throw new BadRequestException('Database connection timed out. Please try again.');
    }

    // 2. Account Existence Check
    if (!userEntity) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Password Check (BCrypt for Dealers, Plaintext/BCrypt for Customers)
    if (userRole === 'DEALER') {
      const passwordMatch = await bcrypt.compare(dto.password, userEntity.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }
    } else {
      if (userEntity.password !== dto.password) {
        throw new UnauthorizedException('Invalid email or password');
      }
    }

    // 4. Verification Check (Only executed IF email & password match)
    if (userEntity.isEmailVerified === false) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in. Check your inbox for the verification link.',
      );
    }

    // 5. Auth Payload Return
    return {
      success: true,
      message: 'Logged in successfully',
      access_token: `mock-jwt-token-for-${userEntity.id}`,
      id: userEntity.id,
      name: userEntity.name,
      email: userEntity.email,
      role: userRole,
    };
  }

  // 🛠️ Profile update method integrated safely at the service layer
  async updateProfile(id: string, dto: { name: string; phone: string }) {
    return this.prisma.customer.update({
      where: { id },
      data: { 
        name: dto.name, 
        phone: dto.phone 
      },
    });
  }




async registerDealer(dto: any) {
    let existingShop: any = null;

    // 1. Check if the business email is already taken
    try {
      existingShop = await this.prisma.laundryShop.findUnique({
        where: { email: dto.email },
      });
    } catch (dbError) {
      console.error('Database connection error during dealer registration:', dbError);
      throw new BadRequestException('Database connection timed out. Please try again.');
    }

    if (existingShop) {
      throw new BadRequestException('This business email is already registered.');
    }

    const fallbackName = dto.email ? dto.email.split('@')[0] : 'Laundry Shop';
    const shopName = dto.dealerName || fallbackName;

    // 2. Hash the password before saving
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create the new laundry shop record
    let newShop: any = null;
    try {
      newShop = await this.prisma.laundryShop.create({
        data: {
          name: shopName,
          city: dto.city,
          phone: dto.phone,
          email: dto.email,
          password: hashedPassword,
          area: dto.area || 'Nairobi Central',
          isEmailVerified: false,
        },
      });
    } catch (createError) {
      console.error('Error creating laundry shop record:', createError);
      throw new BadRequestException('Failed to register business. Please try again.');
    }

    // 4. Dispatch verification email
    try {
      await this.sendVerificationEmail(
        newShop.id, 
        newShop.email, 
        newShop.name ?? fallbackName
      );
    } catch (emailErr) {
      console.error('FAILED TO SEND VERIFICATION EMAIL:', emailErr);
      throw new BadRequestException('Account created, but failed to send verification email. Please check server credentials.');
    }

    // 5. Return success response
    return {
      success: true,
      message: 'Laundrymart registered successfully! Please check your email to verify.',
      id: newShop.id,
    };
  }
  
  // // 3️⃣ FORGOT PASSWORD (Find User & Send Email)
  // async forgotPassword(email: string) {
  //   if (!email) {
  //     throw new BadRequestException('Email address is required');
  //   }

  //   let user: any = null;

  //   try {
  //     user = await this.prisma.customer.findUnique({ where: { email } });
  //     if (!user) {
  //       user = await this.prisma.laundryShop.findUnique({ where: { email } });
  //     }
  //   } catch (dbError) {
  //     console.error('Database Query Error:', dbError);
  //     throw new BadRequestException('Database error. Please try again.');
  //   }

  //   if (!user) {
  //     throw new NotFoundException('No account registered with this email address.');
  //   }

  //   const resetUrl = `https://naipickndroplaundrycleaners.velmoragrouphub.com/#/reset-password?userId=${user.id}`;


  //   const transporter = nodemailer.createTransport({
  //     host: 'smtp.gmail.com', // Explicitly specify host
  //     port: 587,             // 👈 Switch from 465 to 587
  // secure: false,          // 👈 Set to false for STARTTLS (port 587)
  // requireTLS: true,       // 👈 Upgrade connection securely via STARTTLS
  //     // port: 465,
  //     // secure: true,
  //     family: 4, // 👈 🎯 FORCES IPv4 (Bypasses Render's broken IPv6 ENETUNREACH)
  //     auth: {
  //       type: 'OAuth2',
  //       user: process.env.GMAIL_USER,
  //       clientId: process.env.GMAIL_CLIENT_ID,
  //       clientSecret: process.env.GMAIL_CLIENT_SECRET,
  //       refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  //     },
  //     connectionTimeout: 10000,
  //     socketTimeout: 10000,
  //   } as any);



  //   try {
  //     await transporter.sendMail({
  //       from: `"NaipickNdroplaundrycleaners" <${process.env.GMAIL_USER}>`,
  //       to: email,
  //       subject: '🔑 Reset Your Password - NaiPick & Drop',
  //       html: `
  //         <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
  //           <h2 style="color: #99326c; text-align: center;">Pick & Drop Laundry</h2>
  //           <hr style="border: none; border-top: 1px solid #eee;" />
  //           <p>Hello <b>${user.name || 'Valued Customer'}</b>,</p>
  //           <p>We received a request to reset your password for your Pick & Drop Laundry account.</p>
  //           <p>Click the button below to reset your password:</p>
  //           <div style="text-align: center; margin: 30px 0;">
  //             <a href="${resetUrl}" style="background-color: #99326c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
  //           </div>
  //           <p style="font-size: 12px; color: #777;">If you did not request a password reset, you can safely ignore this email.</p>
  //         </div>
  //       `,
  //     });

  //     return {
  //       success: true,
  //       message: 'Password reset instructions have been sent to your email.',
  //     };
  //   } catch (mailError) {
  //     console.error('Nodemailer / OAuth2 Error:', mailError);
  //     throw new BadRequestException('Failed to dispatch email. Please check server credentials.');
  //   }
  // }



  // ... inside AuthService ...

  // 3️⃣ FORGOT PASSWORD (Find User & Send Email via Gmail REST API)
  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }

    let user: any = null;

    try {
      user = await this.prisma.customer.findUnique({ where: { email } });
      if (!user) {
        user = await this.prisma.laundryShop.findUnique({ where: { email } });
      }
    } catch (dbError) {
      console.error('Database Query Error:', dbError);
      throw new BadRequestException('Database error. Please try again.');
    }

    if (!user) {
      throw new NotFoundException('No account registered with this email address.');
    }

    const resetUrl = `https://naipickndroplaundrycleaners.velmoragrouphub.com/#/reset-password?userId=${user.id}`;

    try {
      // 1. Initialize Google OAuth2 Client
      const oauth2Client = new OAuth2Client(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });

      // 2. Fetch fresh access token via HTTPS (Port 443)
      const { token } = await oauth2Client.getAccessToken();
      if (!token) {
        throw new Error('Failed to retrieve OAuth2 access token from Google.');
      }

      // 3. Construct raw RFC 2822 email message
      const subject = '🔑 Reset Your Password - NaiPick & Drop';
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

      const messageParts = [
        `To: ${email}`,
        `From: NaiPick & Drop Laundry <${process.env.GMAIL_USER}>`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #99326c; text-align: center;">Pick & Drop Laundry</h2>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p>Hello <b>${user.name || 'Valued Customer'}</b>,</p>
          <p>We received a request to reset your password for your Pick & Drop Laundry account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #99326c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #777;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        `,
      ];

      const message = messageParts.join('\n');

      // Base64Url encode the message (RFC 4648 format for Gmail API)
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 4. Send email via HTTPS POST (Port 443)
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMessage }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Password reset email sent via Gmail API! (ID: ${result.id})`);
        return {
          success: true,
          message: 'Password reset instructions have been sent to your email.',
        };
      } else {
        const errorData = await response.json();
        console.error('❌ Gmail REST API Error:', errorData);
        throw new BadRequestException('Failed to dispatch password reset email via Gmail API.');
      }
    } catch (mailError: any) {
      console.error('🚨 Gmail API Forgot Password Error:', mailError?.message || mailError);
      throw new BadRequestException('Failed to dispatch email. Please check server credentials.');
    }
  }



  // 4️⃣ RESET PASSWORD (Update Password in DB)
  async resetPassword(dto: { userId: string; newPassword: string }) {
    const { userId, newPassword } = dto;

    if (!userId || !newPassword) {
      throw new BadRequestException('User ID and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: userId },
    });

    if (customer) {
      await this.prisma.customer.update({
        where: { id: userId },
        data: { password: newPassword },
      });

      return {
        success: true,
        message: 'Customer password updated successfully',
      };
    }

    const shop = await this.prisma.laundryShop.findUnique({
      where: { id: userId },
    });

    if (shop) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.laundryShop.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: 'Laundry shop password updated successfully',
      };
    }

    throw new NotFoundException('Account not found or invalid user ID');
  }





// ... inside AuthService ...

private async sendVerificationEmail(userId: string, email: string, name?: string) {
  const baseUrl = process.env.BACKEND_URL || 'https://pickndropdrycleaners-backend.onrender.com';
  const verifyUrl = `${baseUrl}/api/auth/verify-email?userId=${userId}`;

  console.log('🔗 Generated Verification URL:', verifyUrl);

  try {
    // 1. Initialize Google OAuth2 Client
    const oauth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    // 2. Fetch fresh access token via HTTPS
    const { token } = await oauth2Client.getAccessToken();
    if (!token) {
      throw new Error('Failed to retrieve OAuth2 access token from Google.');
    }

    // 3. Construct raw RFC 2822 email message
    const subject = '✉️ Verify Your Email - NaiPick & Drop';
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

    const messageParts = [
      `To: ${email}`,
      `From: NaiPick & Drop Laundry <${process.env.GMAIL_USER}>`,
      `Subject: ${utf8Subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #99326c; text-align: center;">Pick & Drop Laundry</h2>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p>Hello <b>${name || 'Valued Customer'}</b>,</p>
        <p>Thank you for signing up! Please confirm your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #99326c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
      </div>
      `,
    ];

    const message = messageParts.join('\n');
    
    // Base64Url encode the message (RFC 4648 format required by Gmail API)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Send email via HTTPS POST (Port 443)
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      },
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Verification email dispatched successfully via Gmail REST API! (ID: ${result.id})`);
      return result;
    } else {
      const errorData = await response.json();
      console.error('❌ Gmail REST API Error:', errorData);
      throw new BadRequestException('Failed to dispatch verification email via Gmail API.');
    }
  } catch (mailError: any) {
    console.error('🚨 Gmail API Verification Email Error:', mailError?.message || mailError);
    throw new BadRequestException('Failed to dispatch verification email. Please check server credentials.');
  }
}



// 2️⃣ VERIFY EMAIL METHOD
async verifyEmail(userId: string) {
  if (!userId) throw new BadRequestException('User ID is required');

  const customer = await this.prisma.customer.findUnique({ where: { id: userId } });
  if (customer) {
    await this.prisma.customer.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
    return { success: true, message: 'Customer email verified successfully' };
  }

  const shop = await this.prisma.laundryShop.findUnique({ where: { id: userId } });
  if (shop) {
    await this.prisma.laundryShop.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
    return { success: true, message: 'Laundry shop email verified successfully' };
  }

  throw new NotFoundException('User not found');
}





}




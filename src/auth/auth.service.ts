

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt'; 

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async registerCustomer(dto: any) {
    // 1. Check if email already exists
    const existingUser = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    // 2. Create the new customer row (Passing a placeholder for name)
    const newCustomer = await this.prisma.customer.create({
      data: {
        name: "Valued Customer", // 👈 Default fallback placeholder string
        email: dto.email,
        phone: dto.phone,
        password: dto.password, 
      },
    });

    return {
      success: true,
      message: 'Customer registered successfully',
      id: newCustomer.id,
    };
  }

  // async login(dto: any) {
  //   // Look for customer matching email
  //   const customer = await this.prisma.customer.findUnique({
  //     where: { email: dto.email },
  //   });

  //   if (!customer || customer.password !== dto.password) {
  //     throw new UnauthorizedException('Invalid email or password');
  //   }

  //   // Return exact payload fields matching what Flutter SharedPreferences expects
  //   return {
  //     access_token: `mock-jwt-token-for-${customer.id}`,
  //     id: customer.id,
  //     name: customer.name,
  //     email: customer.email, // 👈 Added this line so your UI drawer can pull the email instantly!
  //     role: 'CUSTOMER',
  //   };
  // }


  async login(dto: any) {
    // 1. First, check if the email belongs to a customer
    let userEntity: any = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    let userRole = 'CUSTOMER';

    // 2. If no customer is found, check the laundryShop (Dealer) table
    if (!userEntity) {
      userEntity = await this.prisma.laundryShop.findUnique({
        where: { email: dto.email },
      });
      userRole = 'DEALER';
    }

    // 3. If it doesn't exist anywhere, drop out early
    if (!userEntity) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Validate the password appropriately based on the account type
    // Note: Customer currently saves plain text passwords, but registerDealer hashes them with bcrypt!
    if (userRole === 'DEALER') {
      const passwordMatch = await bcrypt.compare(dto.password, userEntity.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }
    } else {
      // Direct text fallback matching for your existing customer setup
      if (userEntity.password !== dto.password) {
        throw new UnauthorizedException('Invalid email or password');
      }
    }

    // 5. Return the exact structure Flutter expects for both roles
    return {
      success: true,
      message: 'Logged in successfully',
      access_token: `mock-jwt-token-for-${userEntity.id}`,
      id: userEntity.id,
      name: userEntity.name,
      email: userEntity.email,
      role: userRole, // 🎯 Will correctly dynamic-pass 'CUSTOMER' or 'DEALER'
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
  // 1. Check if the business email is already taken
  const existingShop = await this.prisma.laundryShop.findUnique({
    where: { email: dto.email }
  });
  
  if (existingShop) {
    throw new BadRequestException('This business email is already registered.');
  }

  // 2. Hash the password before saving for security (assuming you use bcrypt)
  const hashedPassword = await bcrypt.hash(dto.password, 10);

  // 3. Create the new laundry shop record in your PostgreSQL database
  const newShop = await this.prisma.laundryShop.create({
      data: {
        name: dto.dealerName,
        city: dto.city,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword,
        area: dto.area || 'Nairobi Central', // Fallback for mandatory field
      },
    });

    return {
      success: true,
      message: 'Laundrymart registered successfully',
      id: newShop.id,
    };
    

  
  }

}
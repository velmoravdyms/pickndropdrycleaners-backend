
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VehicleType } from '@prisma/client';

@Injectable()
export class OrdersService {
  // Inject your live Prisma Database Client
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    try {
      // 🏷️ Generate a clean human-readable tracking code for the customer UI
      const trackingCode = `PD-${Math.floor(100000 + Math.random() * 900000)}`;

      // Write row to Neon Postgres matching your specific schema models
      const newOrder = await this.prisma.order.create({
        data: {
          orderCode: trackingCode,
          pickupAddress: createOrderDto.pickupAddress,
          exactLatitude: createOrderDto.exactLatitude,
          exactLongitude: createOrderDto.exactLongitude,
          // Safe enum parsing: Converts incoming "Bike" -> "BIKE" / "Car" -> "CAR"
          transportMode: createOrderDto.transportMode.toUpperCase() as VehicleType,
          estimatedWeightKgs: createOrderDto.estimatedWeightKgs,
          
          // Item Breakdown configurations (defaults to 0 if not sent)
          duvets: createOrderDto.duvets || 0,
          suits: createOrderDto.suits || 0,
          shirts: createOrderDto.shirts || 0,
          specialInstructions: createOrderDto.specialInstructions,
          
          // Financial mappings
          logisticsFee: createOrderDto.logisticsFee,
          cleaningFee: createOrderDto.cleaningFee,
          platformCommission: createOrderDto.platformCommission || 0.0,
          estimatedTotal: createOrderDto.estimatedTotal,
          
          // Connect relational foreign keys to your exact models: Customer & LaundryShop
          customer: { 
            connect: { id: createOrderDto.customerId } 
          },
          shop: { 
            connect: { id: createOrderDto.shopId } 
          },
          
          // Status defaults automatically to OrderStatus.ORDER_PLACED based on your schema
        },
      });

      return {
        success: true,
        message: 'Order successfully saved to the marketplace grid!',
        order_id: newOrder.orderCode,
        id: newOrder.id,
      };

    } catch (error) {
      console.error('Prisma Save Order Error:', error);
      throw new InternalServerErrorException('Database failed to commit order payload');
    }
  }

  // Fetch all orders for a specific Laundry Shop to feed your Admin Dashboard view
  async findByShop(shopId: string) {
    return this.prisma.order.findMany({
      where: { shopId },
      include: {
        customer: {
          select: { name: true, phone: true, email: true }
        },
        rider: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { VehicleType } from '@prisma/client'; 

interface SpecialItems {
  duvets: number;
  suits: number;
  shirts: number;
}

interface Financials {
  logistics_cost: number;
  weight_cost: number;
  special_items_cost: number;
  total_price_estimated: number;
}

interface CreateOrderDto {
  customerId: string; // 🔄 Added dynamically from Flutter local state storage
  shopId: string;     // 🔄 Added dynamically from Flutter local state storage
  pickup_address: string;
  exact_latitude: number;
  exact_longitude: number;
  transport_mode: string; 
  estimated_weight_kgs: number;
  special_items: SpecialItems;
  notes: string;
  financials: Financials;
}

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly prisma: PrismaService) {}

  // 📝 1. POST: CREATE A NEW LIVE ORDER
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    this.logger.log(`Incoming pickup order received for address: ${createOrderDto.pickup_address}`);

    try {
      // Generate unique human-readable tracking code
      const dynamicOrderCode = `ORD-${Date.now().toString().slice(-6)}`;

      // Safe enum parsing: Converts incoming "Bike" -> "BIKE" / "Car" -> "CAR"
      const parsedVehicleType = createOrderDto.transport_mode.toUpperCase() as VehicleType;


      // 1. Prepare your base payload with the verified customer connection
      const orderPayload: any = {
        orderCode: dynamicOrderCode,
        pickupAddress: createOrderDto.pickup_address,
        exactLatitude: createOrderDto.exact_latitude,
        exactLongitude: createOrderDto.exact_longitude,
        transportMode: parsedVehicleType,
        estimatedWeightKgs: createOrderDto.estimated_weight_kgs,
        
        // Item breakdown mapping
        duvets: createOrderDto.special_items?.duvets || 0,
        suits: createOrderDto.special_items?.suits || 0,
        shirts: createOrderDto.special_items?.shirts || 0,
        specialInstructions: createOrderDto.notes || "", 

        // Financial mappings
        logisticsFee: createOrderDto.financials?.logistics_cost || 0,
        cleaningFee: (createOrderDto.financials?.weight_cost || 0) + (createOrderDto.financials?.special_items_cost || 0), 
        platformCommission: 0.0, 
        estimatedTotal: createOrderDto.financials?.total_price_estimated || 0,

        // Connect customer row
        customer: {
          connect: { id: createOrderDto.customerId }
        },
      };

      // // 2. 🎯 Connect the shop ONLY if a shopId is provided by the frontend
      // if (createOrderDto.shopId) {
      //   orderPayload.shop = {
      //     connect: { id: createOrderDto.shopId }
      //   };
      // }



      // 2. 🎯 HUB FALLBACK ROUTING
      if (createOrderDto.shopId && createOrderDto.shopId.trim() !== "") {
        // If the app explicitly targets a specific shop branch
        orderPayload.shop = {
          connect: { id: createOrderDto.shopId }
        };
      } else {
        // 🏢 Assign directly to the Main Hub if no shop was specified
        orderPayload.shop = {
          // connect: { id: "9dc2a265-e95b-483a-a3e4-090ea4a4871b" } // <-- Put your main hub's true database UUID here
          connect: { id: "9a835ba9-ba82-4390-b919-16e66e403d51" } // <-- Put your main hub's true database UUID here
          // 9a835ba9-ba82-4390-b919-16e66e403d51
        
        };
      }

      // 3. Execute database submission cleanly
      const newOrder = await this.prisma.order.create({
        data: orderPayload
      });



      this.logger.log(`Order successfully written to Neon Postgres DB! ID: ${newOrder.id}`);

      return {
        success: true,
        message: 'Order recorded successfully into database.',
        id: newOrder.id,
        orderCode: newOrder.orderCode,
        createdAt: newOrder.createdAt,
      };























    } catch (error: any) {
      this.logger.error(`Failed to commit order details to database: ${error.message}`);
      throw error;
    }
  }

  // 📋 2. GET: FETCH ALL ACTIVE ACTIVE BOOKINGS FOR A SPECIFIC SHOP
  // This is the exact endpoint your Flutter Admin Dashboard calls!
  // @Get('shop/:shopId')
  // async getShopOrders(@Param('shopId') shopId: string) {
  //   this.logger.log(`Fetching active order pipeline ledger data for Shop ID: ${shopId}`);
    
  //   const orders = await this.prisma.order.findMany({
  //     where: { shopId },
  //     include: {
  //       customer: {
  //         select: {
  //           name: true,
  //           phone: true,
  //           email: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: 'desc', // Show newest orders first
  //     },
  //   });

  //   // Remap data fields to cleanly match what your Flutter code needs to read
  //   return orders.map(order => ({
  //     id: order.orderCode,
  //     customer_name: order.customer?.name || 'Walk-in Client',
  //     phone: order.customer?.phone || '',
  //     transport_mode: order.transportMode === 'BIKE' ? 'Motorbike 🛵' : 'Van 🛻',
  //     estimated_weight: order.estimatedWeightKgs,
  //     duvet_count: order.duvets,
  //     suit_count: order.suits,
  //     shirt_count: order.shirts,
  //     estimated_total: order.estimatedTotal,
  //     status: order.status, // e.g., ORDER_PLACED
  //     created_at: 'Just now', // You can map real time differences here if needed
  //   }));
  // }


  // 📋 GET: FETCH ALL ACTIVE BOOKINGS FOR A SPECIFIC SHOP
  @Get('shop/:shopId')
  async getShopOrders(@Param('shopId') shopId: string) {
    this.logger.log(`Fetching order ledger data for Shop ID: ${shopId}`);
    
    const orders = await this.prisma.order.findMany({
      where: { shopId },
      include: {
        customer: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(order => {
      // 🎯 1. DERIVE USERNAME FROM EMAIL
      // Turns "velmoragrouphub@gmail.com" into "Velmoragrouphub"
      const rawEmail = order.customer?.email || '';
      const emailPrefix = rawEmail.includes('@') ? rawEmail.split('@')[0] : 'Customer';
      const derivedUsername = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

      // 🎯 2. FORMAT EXACT LOCATION & COORDINATES
      const formattedLocation = order.pickupAddress && order.pickupAddress.trim() !== ''
        ? order.pickupAddress
        : `Coords: (${order.exactLatitude}, ${order.exactLongitude})`;

      return {
        id: order.orderCode,
        customer_username: derivedUsername, // 👤 Smart email-split username
        customer_email: rawEmail,            // 📧 Email
        customer_phone: order.customer?.phone || 'No phone provided', // 📞 Phone
        pickup_address: formattedLocation,  // 📍 Location/Coordinates
        latitude: order.exactLatitude,
        longitude: order.exactLongitude,
        
        // 📦 Order Items & Weight
        transport_mode: order.transportMode === 'BIKE' ? 'Motorbike 🛵' : 'Van 🛻',
        estimated_weight: order.estimatedWeightKgs,
        duvet_count: order.duvets,
        suit_count: order.suits,
        shirt_count: order.shirts,
        special_notes: order.specialInstructions || 'None',
        
        // 💰 Financials & Status
        estimated_total: order.estimatedTotal,
        status: order.status || 'ORDER_PLACED',
        created_at: order.createdAt,
      };
    });
  }










  
}
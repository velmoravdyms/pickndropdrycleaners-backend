export class CreateOrderDto {
  customerId!: string;
  shopId!: string;
  pickupAddress!: string;
  exactLatitude!: number;
  exactLongitude!: number;
  transportMode!: 'BIKE' | 'CAR';
  estimatedWeightKgs!: number;

  // Optional fields are already fine with the '?' operator
  duvets?: number;
  suits?: number;
  shirts?: number;
  specialInstructions?: string;

  logisticsFee!: number;
  cleaningFee!: number;
  platformCommission!: number;
  estimatedTotal!: number;
}
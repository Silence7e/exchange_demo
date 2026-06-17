import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderSide, OrderType } from '@exchange/shared';

export class PlaceOrderBodyDto {
  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiProperty({ enum: OrderSide })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  price?: string;

  @ApiProperty()
  @IsString()
  quantity: string;
}

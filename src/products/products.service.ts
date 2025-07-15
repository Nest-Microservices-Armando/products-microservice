import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';



@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    // Optionally connect to the database here
    this.$connect();
    this.logger.log('ProductsService initialized and connected to the database');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({ 
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = await this.product.count({
      where: { available: true },
    });

    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true }, // Ensure we only fetch available products
      }),
      meta: {
        currentPage: page,
        totalItems: totalPages,
        lastPage: lastPage,
      }
    };
  }

  async findOne(id: number) {
    // If Id does not exist, Prisma will throw an error
    const product = await this.product.findUnique({
      where: { id, available: true }, // Ensure we only fetch available products
    });

    if (!product) {
      throw new NotFoundException(`Product with id #${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: __, ...data } = updateProductDto;

    await this.findOne(id); // Ensure the product exists before updating  
    
    return this.product.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: number) {

    await this.findOne(id); // Ensure the product exists before removing

    // return this.product.delete({
    //   where: { id },
    // });

    const product = await this.product.update({
      where: { id },
      data: { available: false }, // Soft delete by marking as unavailable
    });

    return product;
  }
}

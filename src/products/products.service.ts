import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('database connected')
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalPages = await this.product.count({
      where: { available: true }
    });
    const lastPage = Math.ceil(totalPages / limit);
    const products = await this.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { available: true }
    });

    return {
      data: products,
      meta: {
        total: totalPages,
        page,
        lastPage
      }
    };
  }

  async findOne(id: number) {
    const productFound = await this.product.findUnique({
      where: { id, available: true }
    });
    if (!productFound) throw new NotFoundException(`Product with id ${id} doesn't exist`);
    return productFound;
  }

  async update(/* id: number, */ updateProductDto: UpdateProductDto) {
    const { id, ...productData } = updateProductDto;
    const product = await this.findOne(id);
    const { name, price } = updateProductDto;
    if (!name && !price) return product;
    const updatedProduct = await this.product.update({
      where: { id },
      data: productData
    });

    return updatedProduct;
  }

  async remove(id: number) {
    await this.findOne(id);

    const updatedProduct = this.product.update({
      where: { id },
      data: { available: false }
    });

    return updatedProduct;

    // return this.product.delete({ where: { id } });
  }
}

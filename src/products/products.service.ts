import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto';
import { RpcException } from '@nestjs/microservices';

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
    if (!productFound) throw new RpcException({
      message: `Product with id ${id} doesn't exist`,
      status: HttpStatus.BAD_REQUEST
    });
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

  async validateProducts(ids: number[]) {

    ids = [...new Set(ids)];
    const products = await this.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some productos were not found',
        status: HttpStatus.BAD_REQUEST
      });

    }

    return products;

  }
}

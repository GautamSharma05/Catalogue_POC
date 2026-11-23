import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service.js';
import { ValidationError, NotFoundError } from '../../lib/errors.js';

@ApiTags('catalogue')
@Controller('api')
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get('products/featured')
  @ApiOperation({ summary: 'Top 5 highest-rated products across all categories' })
  @ApiResponse({ status: 200, description: 'Array of Product, highest rating first.' })
  async getFeatured() {
    return this.catalogueService.getFeatured();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Distinct category names present in the catalogue' })
  @ApiResponse({ status: 200, description: 'string[], e.g. ["electronics", "jewelery", ...].' })
  async getCategories() {
    return this.catalogueService.getCategories();
  }

  @Get('categories/:slug/products')
  @ApiOperation({ summary: 'Products in one category, split into top-rated and the rest' })
  @ApiParam({ name: 'slug', example: 'electronics', description: 'Exact category name (not URL-slugified beyond encoding).' })
  @ApiResponse({ status: 200, description: 'CategoryView: { category, topRated: Product[], others: Product[] }.' })
  async getCategoryView(@Param('slug') slug: string) {
    return this.catalogueService.getCategoryView(slug);
  }

  @Get('products')
  @ApiOperation({ summary: 'Full-text search over product title and description' })
  @ApiQuery({ name: 'search', required: true, example: 'shirt', description: 'Case-insensitive substring match.' })
  @ApiResponse({ status: 200, description: 'Array of matching Product.' })
  @ApiResponse({ status: 400, description: 'Missing or empty "search" query parameter.' })
  async search(@Query('search') search?: string) {
    const term = typeof search === 'string' ? search : '';
    if (term.trim().length === 0) {
      throw new ValidationError('Query parameter "search" is required and must not be empty');
    }
    return this.catalogueService.search(term);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'A single product by id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Product.' })
  @ApiResponse({ status: 400, description: 'Id is not an integer.' })
  @ApiResponse({ status: 404, description: 'No product with that id.' })
  async getProductById(@Param('id') idParam: string) {
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Product id must be an integer');
    }
    const product = await this.catalogueService.getProductById(id);
    if (!product) {
      throw new NotFoundError(`No product found with id ${id}`);
    }
    return product;
  }
}

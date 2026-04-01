import { ExportProductsCommand, ExportProductsResult } from '../dto';
import { IExportProductsUseCase } from '../ports/input';
import { IProductRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class ExportProductsUseCase implements IExportProductsUseCase {
  private readonly logger = createLogger('ExportProductsUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(command: ExportProductsCommand): Promise<ExportProductsResult> {
    this.logger.info('Exporting products to CSV', { command });

    // Set defaults - no pagination limit for export
    const page = 1;
    const limit = 10000; // Large limit to get all products
    const sortBy = command.sortBy || 'createdAt';
    const sortOrder = command.sortOrder || 'desc';
    const status = command.status || 'active';

    // Fetch products with filters
    const result = await this.productRepository.findManyWithFilters({
      ...command,
      page,
      limit,
      sortBy,
      sortOrder,
      status,
    });

    // Convert to CSV
    const csvContent = this.convertToCSV(result.items);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products-${timestamp}.csv`;

    this.logger.info('Products exported successfully', {
      count: result.items.length,
      filename,
    });

    return {
      csvContent,
      filename,
    };
  }

  private convertToCSV(products: any[]): string {
    // CSV Header
    const headers = [
      'ID',
      'Name',
      'Base Price',
      'Total Stock',
      'Categories',
      'Tags',
      'Status',
      'Created At',
    ];

    // CSV Rows
    const rows = products.map((product) => {
      const categories = product.categories.map((c: any) => c.name).join('|');
      const tags = product.tags.map((t: any) => t.name).join('|');
      const createdAt = new Date(product.createdAt).toISOString();

      return [
        product.id,
        `"${this.escapeCSV(product.name)}"`,
        product.basePrice,
        product.variantsSummary.totalStock,
        `"${this.escapeCSV(categories)}"`,
        `"${this.escapeCSV(tags)}"`,
        product.status,
        createdAt,
      ].join(',');
    });

    // Combine header and rows
    return [headers.join(','), ...rows].join('\n');
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    // Escape double quotes by doubling them
    return value.replace(/"/g, '""');
  }
}

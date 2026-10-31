import { entity, boolean, date, decimal, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

@entity()
export class Product extends Source({ schema: 'dbo', table: 'Product', primaryKey: [] }) {
  @text({ optional: true, column: 'ID', max: 8000 }) id?: string;
  @text({ optional: true, column: 'Name', max: 8000 }) name?: string;
  @text({ optional: true, column: 'SKU', max: 8000 }) sku?: string;
  @text({ optional: true, column: 'Description', max: 8000 }) description?: string;
  @decimal({ optional: true, column: 'Price', precision: 28, scale: 6 }) price?: number;
  @int({ optional: true, column: 'StockQuantity' }) stockQuantity?: number;
  @int({ optional: true, column: 'ReorderLevel' }) reorderLevel?: number;
  @date({ optional: true, column: 'CreatedDate' }) createdDate?: Date;
  @date({ optional: true, column: 'ModifiedDate' }) modifiedDate?: Date;
  @boolean({ optional: true, column: 'IsActive' }) isActive?: boolean;
  @date({ optional: true, column: 'CreatedOn' }) createdOn?: Date;
  @date({ optional: true, column: 'ModifiedOn' }) modifiedOn?: Date;
  @text({ optional: true, column: 'CreatedByID', max: 8000 }) createdById?: string;
  @text({ optional: true, column: 'ModifiedByID', max: 8000 }) modifiedById?: string;
  @text({ optional: true, column: 'StatusID', max: 8000 }) statusId?: string;
  @text({ optional: true, column: 'OwnerID', max: 8000 }) ownerId?: string;
  @text({ optional: true, column: 'URLSlug', max: 8000 }) urlSlug?: string;
}

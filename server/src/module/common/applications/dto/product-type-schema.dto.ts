export interface ProductTypeDto {
  id: string;
  code: string;
  name: string;
}

export interface AxisAttributeDto {
  id: string;
  code: string;
  name: string;
  dataType: string;
  unit: string | null;
  axisOrder: number | null;
}

export interface ProductTypeSchemaDto {
  productType: ProductTypeDto | null;
  variantAxisAttributes: AxisAttributeDto[];
}

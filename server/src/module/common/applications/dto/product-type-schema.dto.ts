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

export interface ProductAttributeSchemaDto {
  id: string;
  code: string;
  name: string;
  dataType: string;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  options: Array<{
    id: string;
    value: string;
    label: string;
    sortOrder: number;
  }>;
}

export interface ProductTypeSchemaDto {
  productType: ProductTypeDto | null;
  variantAxisAttributes: AxisAttributeDto[];
  productAttributes: ProductAttributeSchemaDto[];
}

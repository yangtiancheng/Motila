export type SchemaFieldType = 'input' | 'password' | 'select' | 'upload';

export type SchemaOption = {
  label: string;
  value: string;
};

export type SchemaField<TValues extends Record<string, unknown>> = {
  name: keyof TValues;
  label: string;
  type: SchemaFieldType;
  required?: boolean;
  min?: number;
  message?: string;
  placeholder?: string;
  options?: SchemaOption[];
  accept?: string;
  previewFallbackName?: keyof TValues;
  colSpan?: number;
  visibleWhen?: (values: Partial<TValues>) => boolean;
  disabledWhen?: (values: Partial<TValues>) => boolean;
};

export function applySchemaTransforms<TValues extends Record<string, unknown>>(
  values: TValues,
  transforms?: Array<(values: TValues) => TValues>,
): TValues {
  if (!transforms?.length) return values;
  return transforms.reduce((acc, transform) => transform(acc), values);
}

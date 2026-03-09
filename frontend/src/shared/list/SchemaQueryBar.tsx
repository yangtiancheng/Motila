import { Button, Form, Input, Select, Space } from 'antd';
import { useEffect } from 'react';
import type { QueryField } from './query.types';

export function SchemaQueryBar<TValues extends Record<string, unknown>>({
  fields,
  initialValues,
  onSearch,
  onReset,
  submitText = '搜索',
}: {
  fields: QueryField<TValues>[];
  initialValues: TValues;
  onSearch: (values: TValues) => void;
  onReset: (values: TValues) => void;
  submitText?: string;
}) {
  const [form] = Form.useForm<TValues>();

  useEffect(() => {
    form.setFieldsValue(initialValues as Parameters<typeof form.setFieldsValue>[0]);
  }, [form, initialValues]);

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={(values) => onSearch(values)}
      style={{ width: '100%' }}
    >
      {fields.map((field) => (
        <Form.Item key={String(field.name)} name={String(field.name)} label={field.label}>
          {field.type === 'input' ? (
            <Input placeholder={field.placeholder} style={{ width: field.width ?? 220 }} allowClear />
          ) : (
            <Select
              allowClear
              placeholder={field.placeholder}
              options={field.options}
              style={{ width: field.width ?? 160 }}
            />
          )}
        </Form.Item>
      ))}

      <Space>
        <Button type="primary" htmlType="submit">
          {submitText}
        </Button>
        <Button
          onClick={() => {
            form.resetFields();
            const next = { ...initialValues };
            form.setFieldsValue(next as Parameters<typeof form.setFieldsValue>[0]);
            onReset(next);
          }}
        >
          重置
        </Button>
      </Space>
    </Form>
  );
}

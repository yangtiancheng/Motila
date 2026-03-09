import { Button, Form, Input, Select } from 'antd';
import { useWatch } from 'antd/es/form/Form';
import type { FormInstance, Rule } from 'antd/es/form';
import type { SchemaField } from './schema.types';

export function SchemaForm<TValues extends Record<string, unknown>>({
  form,
  fields,
  loading,
  submitText,
  onFinish,
}: {
  form: FormInstance<TValues>;
  fields: SchemaField<TValues>[];
  loading: boolean;
  submitText: string;
  onFinish: (values: TValues) => Promise<void>;
}) {
  const values = (useWatch([], form) as Partial<TValues>) ?? {};

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <div className="grid-form">
        {fields.map((field) => {
          if (field.visibleWhen && !field.visibleWhen(values)) {
            return null;
          }

          const rules: Rule[] = [];

          if (field.required) {
            rules.push({ required: true, message: field.message ?? `${field.label}为必填项` });
          }

          if (field.type === 'input' && field.name === 'email') {
            rules.push({ type: 'email', message: '邮箱格式不正确' });
          }

          if (field.min) {
            rules.push({ min: field.min, message: field.message ?? `${field.label}至少${field.min}位` });
          }

          const disabled = field.disabledWhen?.(values) ?? false;

          return (
            <Form.Item key={String(field.name)} label={field.label} name={String(field.name)} rules={rules}>
              {field.type === 'input' ? <Input placeholder={field.placeholder} disabled={disabled} /> : null}
              {field.type === 'password' ? <Input.Password placeholder={field.placeholder} disabled={disabled} /> : null}
              {field.type === 'select' ? (
                <Select options={field.options} placeholder={field.placeholder} disabled={disabled} />
              ) : null}
            </Form.Item>
          );
        })}
      </div>

      <Button type="primary" htmlType="submit" loading={loading}>
        {submitText}
      </Button>
    </Form>
  );
}

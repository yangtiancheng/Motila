import { Button, Form, Input, Select, Space, Upload } from 'antd';
import { useWatch } from 'antd/es/form/Form';
import type { FormInstance, Rule } from 'antd/es/form';
import type { SchemaField } from './schema.types';

export function SchemaForm<TValues extends Record<string, unknown>>({
  form,
  fields,
  loading,
  submitText,
  onFinish,
  columns = 2,
}: {
  form: FormInstance<TValues>;
  fields: SchemaField<TValues>[];
  loading: boolean;
  submitText: string;
  onFinish: (values: TValues) => Promise<void>;
  columns?: number;
}) {
  const values = (useWatch([], form) as Partial<TValues>) ?? {};

  const uploadBase64 = (name: keyof TValues, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      form.setFieldValue(name as any, String(reader.result ?? ''));
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <div className="grid-form" style={{ gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))` }}>
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
            <Form.Item
              key={String(field.name)}
              label={field.label}
              style={field.colSpan ? { gridColumn: `span ${field.colSpan}` } : undefined}
            >
              {field.type === 'input' ? (
                <Form.Item name={String(field.name)} rules={rules} noStyle>
                  <Input placeholder={field.placeholder} disabled={disabled} />
                </Form.Item>
              ) : null}
              {field.type === 'password' ? (
                <Form.Item name={String(field.name)} rules={rules} noStyle>
                  <Input.Password placeholder={field.placeholder} disabled={disabled} />
                </Form.Item>
              ) : null}
              {field.type === 'select' ? (
                <Form.Item name={String(field.name)} rules={rules} noStyle>
                  <Select options={field.options} placeholder={field.placeholder} disabled={disabled} />
                </Form.Item>
              ) : null}
              {field.type === 'upload' ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    beforeUpload={(file) => uploadBase64(field.name, file as File)}
                    showUploadList={false}
                    accept={field.accept ?? 'image/png,image/jpeg,image/webp'}
                    disabled={disabled}
                  >
                    <Button disabled={disabled}>上传图片</Button>
                  </Upload>
                  <Form.Item name={String(field.name)} rules={rules} noStyle>
                    <Input.TextArea
                      rows={3}
                      placeholder={field.placeholder ?? '也可粘贴 data:image/...;base64,...'}
                      disabled={disabled}
                    />
                  </Form.Item>
                  {values[field.name] ? (
                    <img
                      src={String(values[field.name])}
                      alt={`${String(field.name)}-preview`}
                      style={{ maxWidth: 160, maxHeight: 160, objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: 8, padding: 4, background: '#fff' }}
                    />
                  ) : field.previewFallbackName && values[field.previewFallbackName] ? (
                    <img
                      src={String(values[field.previewFallbackName])}
                      alt={`${String(field.previewFallbackName)}-preview`}
                      style={{ maxWidth: 160, maxHeight: 160, objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: 8, padding: 4, background: '#fff' }}
                    />
                  ) : null}
                </Space>
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

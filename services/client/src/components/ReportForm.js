import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Form, Input } from 'antd';

import mysql from 'assets/images/mysql.svg';
import postgres from 'assets/images/postgres.svg';
import mongobi from 'assets/images/mongobi.svg';

import useFormItems from 'hooks/useFormItems';
import FormTiles from './FormTiles';

const defaultFormItems = {
  'delivery_config.metric': {
    label: 'Metric',
    required: true,
  },
  'delivery_config.granularity': {
    label: 'Granularity',
    required: true,
  },
  'delivery_config.date_range': {
    label: 'Date Range',
    required: true,
  },
  'delivery_config.schedule': {
    label: 'Schedule (cron format)',
    required: true,
    placeholder: '* * * * * (Minute, Hour, Day, Month, Weekday)',
  },
};

const deliveryFormItems = {
  default: defaultFormItems,
  webhook: {
    ...defaultFormItems,
    url: {
      label: 'URL',
      required: true,
      placeholder: 'https://webhook.catch',
    },
  },
  slack: {
    ...defaultFormItems,
    channel_name: {
      label: 'Channel Name',
      required: true,
      placeholder: '#general',
    },
  },
  email: {
    ...defaultFormItems,
    address: {
      label: 'Email',
      required: true,
      placeholder: 'one@example.com',
    },
  },
};

const deliveryTiles = [
  { title: 'Webhook', imgSrc: postgres },
  { title: 'Slack', imgSrc: mysql },
  { title: 'Email', imgSrc: mongobi }
];

const ReportForm = React.forwardRef((props, ref) => {
  const {
    edit, form, initialValues, onSubmit,
    onDeliveryTypeSelect,
    ...restProps
  } = props;

  const { delivery_type: deliveryType } = initialValues;

  const config = useMemo(
    () => deliveryFormItems[deliveryType && deliveryType.toLowerCase()] || deliveryFormItems.default,
    [deliveryType]
  );

  const [formItems] = useFormItems({ ref, form, initialValues, config });

  if (!deliveryType && !edit) {
    return (
      <FormTiles tiles={deliveryTiles} onSelect={onDeliveryTypeSelect} {...restProps} />
    );
  }

  return (
    <Row gutter={24}>
      <Form onSubmit={onSubmit} {...restProps}>
        <Col span={12}>
          <Form.Item label="Report Name" required>
            {form.getFieldDecorator('name', {
              initialValue: initialValues.name,
              rules: [
                { required: true, message: 'Name is required' }
              ]
            })(<Input />)}
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Type" required>
            {form.getFieldDecorator('delivery_type', {
              initialValue: initialValues.delivery_type,
              rules: [{ required: true }]
            })(<Input style={{ textTransform: 'lowercase' }} disabled />)}
          </Form.Item>
        </Col>

        {formItems}
      </Form>
    </Row>
  );
});

ReportForm.propTypes = {
  form: PropTypes.object.isRequired,
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDeliveryTypeSelect: PropTypes.func.isRequired,
  edit: PropTypes.bool,
  style: PropTypes.object,
};

ReportForm.defaultProps = {
  edit: false,
  style: {},
};

export default Form.create()(ReportForm);
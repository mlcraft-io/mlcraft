import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Icon, Popconfirm } from 'antd';
import Loader from 'components/Loader';
import Chart from 'components/Chart';
import EditableField from 'components/EditableField';

import useAppSettings from 'hooks/useAppSettings';
import useCheckResponse from 'hooks/useCheckResponse';
import useDimensions from 'hooks/useDimensions';
import usePinnedItems from 'hooks/usePinnedItems';
import useExplorations from 'hooks/useExplorations';

import s from './PinnedItem.module.css';

const PinnedItem = ({ rowId, updateDashboard }) => {
  const [, size] = useDimensions(document.querySelector(`#pinned-item-${rowId}`));
  const { withAuthPrefix } = useAppSettings();

  const { t } = useTranslation();
  const [renaming, setRenaming] = useState(false);

  const {
    current,
    queries: {
      currentData: {
        fetching: loadingPinnedItem,
      },
      execQueryCurrent,
    },
    mutations: {
      deleteMutation, execDeleteMutation,
      updateMutation, execUpdateMutation
    }
  } = usePinnedItems({
    params: {
      editId: rowId,
    },
  });

  const {
    queries: {
      currentData: explorationData,
    },
  } = useExplorations({
    params: {
      editId: current?.exploration?.id,
    },
  });

  const onUpdate = () => {
    setRenaming(false);
    execQueryCurrent();
  };

  const onDelete = (res) => {
    if (res) {
      updateDashboard();
    }
  };

  useCheckResponse(updateMutation, onUpdate, {
    successMessage: t('Successfully updated'),
  });

  useCheckResponse(deleteMutation, onDelete, {
    successMessage: t('Successfully deleted'),
  });

  const onConfirmDelete = () => {
    execDeleteMutation({ id: rowId });
  };

  const onRename = (id, value) => {
    const { name } = value || {};

    if (current?.name && name === current?.name) {
      return null;
    }

    setRenaming(true);

    return execUpdateMutation({ 
      pk_columns: {
        id,
      },
      _set: {
        name,
      },
    });
  };

  const slug = current?.exploration?.id;
  const datasourceId = current?.exploration?.datasource_id;
  const type = current?.spec?.type;

  let link = withAuthPrefix(`/explore/${datasourceId}/${slug}`);

  if (type === 'chart') {
    link = `${link}?chart=${current.id}`;
  }

  return (
    <div className={s.pinnedItem} id={`pinned-item-${rowId}`}>
      <div className={s.header}>
        {current?.id && (
          <Loader spinning={renaming}>
            <EditableField
              currentValue={current?.name || ''}
              renameFunc={onRename}
              id={current?.id}
              style={{ minWidth: 0 }}
            />
          </Loader>
        )}
        <div>
          {datasourceId && slug && (
            <>
              <Link to={withAuthPrefix(`/charts/${rowId}`)} style={{ marginRight: 10 }}>
                <Icon type="export" />
              </Link>
              <Link to={link} style={{ marginRight: 10 }}>
                <Icon type="eye" />
              </Link>
            </>
          )}
          <Popconfirm
            title={t('Are you sure delete this chart?')}
            onConfirm={onConfirmDelete}
            okText={t('Yes')}
            okType="danger"
            cancelText={t('No')}
          >
            <Icon className={s.closeButton} type="close" />
          </Popconfirm>
        </div>
      </div>
      <Chart
        spec={current?.spec}
        values={explorationData?.data?.fetch_dataset?.data}
        loading={loadingPinnedItem || explorationData.fetching}
        size={size}
      />
    </div>
  );
};

PinnedItem.propTypes = {
  rowId: PropTypes.string.isRequired,
  updateDashboard: PropTypes.func,
};

PinnedItem.defaultProps = {
  updateDashboard: () => {},
};

export default PinnedItem;

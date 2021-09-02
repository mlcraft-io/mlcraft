import { useCallback, useEffect, useMemo } from 'react';

import { get, getOr } from 'unchanged';
import { useQuery, useMutation, useSubscription } from 'urql';

const newdatasourceMutation = `
  mutation ($object: datasources_insert_input!) {
    insert_datasources_one(object: $object) {
      id
      name
    }
  }
`;

const datasourcesQuery = `
  query ($offset: Int, $limit: Int, $where: datasources_bool_exp, $order_by: [datasources_order_by!]) {
    datasources (offset: $offset, limit: $limit, where: $where, order_by: $order_by) {
      id
      name
      db_type
      created_at
      updated_at

      dataschemas {
        id
        name
      }
    }
    datasources_aggregate (where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const editdatasourceMutation = `
  mutation (
    $pk_columns: datasources_pk_columns_input!,
    $_set: datasources_set_input!
  ) {
    update_datasources_by_pk(pk_columns: $pk_columns, _set: $_set) {
      id
    }
  }
`;

const checkdatasourceMutation = `
  mutation (
    $id: uuid!,
  ) {
    check_connection(datasource_id: $id) {
      message
      code
    }
  }
`;

const editdatasourceQuery = `
  query ($id: uuid!) {
    datasources_by_pk(id: $id) {
      id
      name
      db_type
      db_params
      created_at
      updated_at
    }
  }
`;

const deldatasourceMutation = `
  mutation ($id: uuid!) {
    delete_datasources_by_pk(id: $id) {
      id
    }
  }
`;

const datasourcesSubscription = `
  subscription ($offset: Int, $limit: Int, $where: datasources_bool_exp, $order_by: [datasources_order_by!]) {
    datasources (offset: $offset, limit: $limit, where: $where, order_by: $order_by) {
      id
      name
    }
  }
`;

const validateSourceMutation = `
  mutation ($id: uuid!) {
    validate_datasource(id: $id) {
      code
      message
    }
  }
`;


const genSourceSchemasMutation = `
  mutation ($datasource_id: uuid!, $tables: [SourceTable!], $overwrite: Boolean) {
    gen_dataschemas(datasource_id: $datasource_id, tables: $tables, overwrite: $overwrite) {
      code
      message
    }
  }
`;

const runSourceSQLMutation = `
  mutation ($datasource_id: uuid!, $query: String!, $limit: Int!) {
    run_query(datasource_id: $datasource_id, query: $query, limit: $limit) {
      result
    }
  }
`;

const getListVariables = (pagination) => {
  let res = {
    order_by: {
      created_at: 'asc',
    },
  };

  if (pagination) {
    res = {
      ...res,
      ...pagination,
    };
  }

  return res;
};

const handleSubscription = (_, response) => response;

const role = 'user';
export default ({ pauseQueryAll, pagination = {}, params = {}, disableSubscription = true }) => {
  const { editId } = params;

  const [createMutation, doCreateMutation] = useMutation(newdatasourceMutation);
  const execCreateMutation = useCallback((input) => {
    return doCreateMutation(input, { role });
  }, [doCreateMutation]);

  const [updateMutation, doUpdateMutation] = useMutation(editdatasourceMutation);
  const execUpdateMutation = useCallback((input) => {
    doUpdateMutation(input, { role });
  }, [doUpdateMutation]);

  const [deleteMutation, doDeleteMutation] = useMutation(deldatasourceMutation);
  const execDeleteMutation = useCallback((input) => {
    doDeleteMutation(input, { role });
  }, [doDeleteMutation]);

  const [checkMutation, doCheckMutation] = useMutation(checkdatasourceMutation);
  const execCheckMutation = useCallback((input) => {
    doCheckMutation(input, { role });
  }, [doCheckMutation]);

  const [genSchemaMutation, doGenSchemaMutation] = useMutation(genSourceSchemasMutation);
  const execGenSchemaMutation = useCallback((input) => {
    doGenSchemaMutation(input, { role });
  }, [doGenSchemaMutation]);

  const [runQueryMutation, doRunQueryMutation] = useMutation(runSourceSQLMutation);
  const execRunQueryMutation = useCallback((input) => {
    doRunQueryMutation(input, { role });
  }, [doRunQueryMutation]);

  const [validateMutation, doValidateMutation] = useMutation(validateSourceMutation);
  const execValidateMutation = useCallback((input) => {
    doValidateMutation(input, { role });
  }, [doValidateMutation]);

  const [allData, doQueryAll] = useQuery({
    query: datasourcesQuery,
    pause: true,
    variables: getListVariables(pagination),
  });

  const [subscription] = useSubscription({
    query: datasourcesSubscription,
    variables: getListVariables(pagination),
    pause: disableSubscription,
  }, handleSubscription);

  const execQueryAll = useCallback((context) => {
    doQueryAll({ requestPolicy: 'cache-and-network', role, ...context });
  }, [doQueryAll]);

  useEffect(() => {
    if (!pauseQueryAll) {
      execQueryAll();
    }
  }, [pauseQueryAll, execQueryAll]);

  const all = useMemo(() => getOr([], 'data.datasources', allData), [allData]);
  const totalCount = useMemo(() => getOr([], 'data.datasources_aggregate.aggregate.count', allData), [allData]);

  const [currentData, doQueryCurrent] = useQuery({
    query: editdatasourceQuery,
    variables: {
      id: editId,
    },
    pause: true,
  });

  const execQueryCurrent = useCallback((context) => {
    doQueryCurrent({ requestPolicy: 'cache-and-network', role, ...context });
  }, [doQueryCurrent]);

  const current = useMemo(() => {
    const datasource = get('data.datasources_by_pk', currentData) || {};
    return datasource;
  }, [currentData]);

  useEffect(() => {
    if (editId) {
      execQueryCurrent();
    }
  }, [editId, execQueryCurrent]);

  return {
    all,
    current,
    totalCount,
    queries: {
      allData,
      execQueryAll,
      currentData,
      execQueryCurrent,
    },
    mutations: {
      createMutation,
      execCreateMutation,
      deleteMutation,
      execDeleteMutation,
      updateMutation,
      execUpdateMutation,
      checkMutation,
      execCheckMutation,

      runQueryMutation,
      execRunQueryMutation,
      validateMutation,
      execValidateMutation,
      genSchemaMutation,
      execGenSchemaMutation,
    },
    subscription,
  };
};
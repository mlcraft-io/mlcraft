import { useEffect, useMemo } from 'react';
import { set } from 'unchanged';
import { useTrackedEffect, useThrottleFn } from 'ahooks';

import useQuery from './useQuery';
import useMutation from './useMutation';
import useCurrentTeamState from './useCurrentTeamState';

const newReportMutation = `
  mutation ($object: reports_insert_input!) {
    insert_reports_one(object: $object) {
      id
      name
    }
  }
`;

const reportsQuery = `
  query ($offset: Int, $limit: Int, $where: reports_bool_exp, $order_by: [reports_order_by!]) {
    reports (offset: $offset, limit: $limit, where: $where, order_by: $order_by) {
      id
      name
      schedule
      delivery_type
      delivery_config
      created_at
      updated_at
    }
    reports_aggregate (where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const editReportMutation = `
  mutation (
    $pk_columns: reports_pk_columns_input!,
    $_set: reports_set_input!
  ) {
    update_reports_by_pk(pk_columns: $pk_columns, _set: $_set) {
      id
    }
  }
`;

const editReportQuery = `
  query ($id: uuid!) {
    reports_by_pk(id: $id) {
      id
      name
      schedule
      delivery_type
      delivery_config
      created_at
      updated_at
    }
  }
`;

const delReportMutation = `
  mutation ($id: uuid!) {
    delete_reports_by_pk(id: $id) {
      id
    }
  }
`;

const getListVariables = (pagination, params = {}) => {
  let res = {
    order_by: {
      created_at: 'desc',
    },
  };

  if (pagination) {
    res = {
      ...res,
      ...pagination,
    };
  }

  if (params?.teamId) {
    res = set('where.team_id._eq', params.teamId, res);
  }

  return res;
};

const role = 'user';
export default ({ pauseQueryAll, pagination = {}, params = {} }) => {
  const { editId } = params;
  const { currentTeamState } = useCurrentTeamState();

  const reqParams = {
    ...params,
    teamId: currentTeamState?.id,
  };

  const [createMutation, execCreateMutation] = useMutation(newReportMutation, { role });
  const [updateMutation, execUpdateMutation] = useMutation(editReportMutation, { role });
  const [deleteMutation, execDeleteMutation] = useMutation(delReportMutation, { role });

  const [allData, doQueryAll] = useQuery({
    query: reportsQuery,
    pause: true,
    variables: getListVariables(pagination, reqParams),
  }, {
    requestPolicy: 'cache-and-network',
    role,
  });

  const { run: execQueryAll } = useThrottleFn(() => {
    return doQueryAll();
  }, {
    wait: 500,
  });

  useEffect(() => {
    if (!pauseQueryAll) {
      execQueryAll();
    }
  }, [pauseQueryAll, execQueryAll]);

  useTrackedEffect((changes, prevDeps, currDeps) => {
    const prevTeam = prevDeps?.[0];
    const currTeam = currDeps?.[0];
    const currPause = currDeps?.[1];

    if (!currPause && prevTeam && currTeam && prevTeam !== currTeam) {
      execQueryAll();
    }
  }, [currentTeamState.id, pauseQueryAll, execQueryAll]);

  const all = useMemo(() => allData.data?.reports || [], [allData.data]);
  const totalCount = useMemo(() => allData.data?.reports_aggregate.aggregate.count, [allData.data]);

  const [currentData, execQueryCurrent] = useQuery({
    query: editReportQuery,
    variables: {
      id: editId,
    },
    pause: true,
  }, {
    requestPolicy: 'cache-and-network',
    role,
  });

  const current = useMemo(() => currentData.data?.reports_by_pk || {}, [currentData.data]);

  useEffect(() => {
    if (editId) {
      execQueryCurrent();
    }
  }, [editId, execQueryCurrent]);

  return {
    all,
    totalCount,
    current,
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
    },
  };
};
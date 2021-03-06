import { useEffect, useMemo } from 'react';

import useMutation from './useMutation';
import useQuery from './useQuery';

const newTeamMutation = `
  mutation CreateTeam($name: String!) {
    create_team(name: $name) {
      id
      name
    }
  }
`;

const editTeamMutation = `
  mutation (
    $pk_columns: teams_pk_columns_input!,
    $_set: teams_set_input!
  ) {
    update_teams_by_pk(pk_columns: $pk_columns, _set: $_set) {
      id
      name
    }
  }
`;

const editTeamQuery = `
  query ($id: uuid!) {
    teams_by_pk(id: $id) {
      id
      created_at
      updated_at
      members {
        user {
          display_name
        }
      }
    }
  }
`;

const role = 'user';
export default (props = {}) => {
  const { params = {} } = props;
  const { editId } = params;

  const [createMutation, execCreateMutation] = useMutation(newTeamMutation, { role });
  const [updateMutation, execUpdateMutation] = useMutation(editTeamMutation, { role });

  const [currentData, execQueryCurrent] = useQuery({
    query: editTeamQuery,
    variables: {
      id: editId,
    },
    pause: true,
  }, {
    requestPolicy: 'cache-and-network',
    role,
  });

  const current = useMemo(() => currentData.data?.teams_by_pk, [currentData.data]);

  useEffect(() => {
    if (editId) {
      execQueryCurrent();
    }
  }, [editId, execQueryCurrent]);

  return {
    current,
    queries: {
      currentData,
      execQueryCurrent,
    },
    mutations: {
      createMutation,
      execCreateMutation,
      updateMutation,
      execUpdateMutation,
    },
  };
};

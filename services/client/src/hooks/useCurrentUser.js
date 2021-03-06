import { useEffect, useCallback } from 'react';

import {
  useRecoilValue,
  useRecoilState,
} from 'recoil';

import { useDebounceFn, useUpdateEffect, useMount, useTrackedEffect } from 'ahooks';

import { useQuery } from 'urql';

import {
  jwtPayload,
  currentUserSelector,
} from '../recoil/currentUser';

import useAuthToken from './useAuthToken';
import useSources from './useSources';
import useDashboards from './useDashboards';
import useSchemas from './useSchemas';
import useCurrentTeamState from './useCurrentTeamState';

const membersFragment = `
  team {
    id
    name
  }
`;

const sourcesFragment = `
  id
  name
  user_id
  team_id
`;

const schemasFragment = `
  id
  user_id
  name
  checksum
  datasource {
    team_id
  }
`;

const dashboardsFragment = `
  id
  name
  user_id
  team_id
`;

const currentUserQuery = `
  query ($id: uuid!, $teamId: uuid) {
    users_by_pk (id: $id) {
      id
      display_name

      members(
        order_by: { created_at: desc }
      ) {
        ${membersFragment}
      }
    }

    datasources (
      order_by: { created_at: desc }
    ) {
      ${sourcesFragment}
    }

    dataschemas (
      order_by: { created_at: desc }
    ) {
      ${schemasFragment}
    }

    dashboards (
      order_by: { created_at: desc }
    ) {
      ${dashboardsFragment}
    }
  }
`;

const currentUserWithTeamQuery = `
  query ($id: uuid!, $teamId: uuid!) {
    users_by_pk (id: $id) {
      id
      display_name

      members(
        order_by: { created_at: desc }
      ) {
        ${membersFragment}
      }
    }

    datasources (
      order_by: { created_at: desc },
      where: { team_id: { _eq: $teamId } }
    ) {
      ${sourcesFragment}
    }

    dataschemas (
      order_by: { created_at: desc },
      where: { datasource: {
        team_id: { _eq: $teamId }
      } }
    ) {
      ${schemasFragment}
    }

    dashboards (
      order_by: { created_at: desc },
      where: { team_id: { _eq: $teamId } }
    ) {
      ${dashboardsFragment}
    }
  }
`;


const role = 'user';
export default (props = {}) => {
  const { pauseQuery = false } = props;

  const [currentUser, setCurrentUser] = useRecoilState(currentUserSelector);
  const {
    currentTeamState,
    setCurrentTeamState
  } = useCurrentTeamState();
  const { authToken } = useAuthToken();

  const JWTpayload = useRecoilValue(jwtPayload);
  const userId = JWTpayload?.['x-hasura-user-id'];

  const [currentUserData, doQueryCurrentUser] = useQuery({
    query: currentTeamState?.id ? currentUserWithTeamQuery : currentUserQuery,
    pause: pauseQuery,
    variables: {
      id: userId,
      teamId: currentTeamState?.id,
    },
  });

  useEffect(() => {
    const userData = currentUserData?.data;

    if (userData) {
      const newUserData = {
        ...userData,
      };

      setCurrentUser(newUserData);
      
      if (!currentTeamState?.id && newUserData?.users_by_pk?.members.length) {
        setCurrentTeamState(newUserData?.users_by_pk?.members?.[0]?.team);
      }
    }
  }, [currentUserData.data, setCurrentUser, currentTeamState.id, setCurrentTeamState]);

  const { run: execQueryCurrentUser } = useDebounceFn((context) => {
    return doQueryCurrentUser({ requestPolicy: 'cache-and-network', role, ...context });
  }, {
    wait: 500,
  });

  useUpdateEffect(() => {
    if (authToken) {
      execQueryCurrentUser();
    }
  }, [authToken, execQueryCurrentUser]);

  const { 
    subscription: sourcesSubscription,
    execSubscription: execSourcesSubscription,
  } = useSources({
    pauseQueryAll: true,
    disableSubscription: true,
  });

  const { 
    subscription: dashboardsSubscription,
    execSubscription: execDashboardsSubscription,
  } = useDashboards({
    pauseQueryAll: true,
    disableSubscription: true,
  });

  const { 
    subscription: schemasSubscription,
    execSubscription: execSchemasSubscription,
  } = useSchemas({
    pauseQueryAll: true,
    disableSubscription: true,
  });

  useUpdateEffect(() => {
    const anyData = sourcesSubscription.data || dashboardsSubscription.data || schemasSubscription.data;

    if (anyData) {
      if (currentUser && Object.keys(currentUser).length) {
        setCurrentUser({
          ...currentUser,
          ...anyData,
        });
      }

      sourcesSubscription.data = null;
      dashboardsSubscription.data = null;
      schemasSubscription.data = null;
    }
  }, [sourcesSubscription.data, dashboardsSubscription.data, schemasSubscription.data, currentUser]);

  useMount(() => {
    execSchemasSubscription();
    execSourcesSubscription();
    execDashboardsSubscription();
  });

  return {
    currentUser,
    queries: {
      currentUserData,
      execQueryCurrentUser,
    },
  };
};

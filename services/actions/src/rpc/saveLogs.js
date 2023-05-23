import { fetchGraphQL } from '../utils/graphql';
import apiError from '../utils/apiError';
import redisClient from "../utils/redis";
import createMd5Hex from '../utils/md5Hex';

const createEventLogsMutation = `
  mutation ($requests: [request_logs_insert_input!]!, $events: [event_logs_insert_input!]!){
    insert_request_logs(objects: $requests, on_conflict: {
      constraint: request_logs_request_id_key,
      update_columns: []
    }) {
      affected_rows
    }
    
    insert_event_logs(objects: $events, on_conflict: {
      constraint: event_logs_request_id_event_key,
      update_columns: []
    }) {
      affected_rows
    }
  }
`;

const streamName = 'streams:cubejs-logs-stream';

export default async () => {
  let streamData;

  try {
    streamData = await redisClient.xread('STREAMS', streamName, 0);
  } catch (e) {
    console.log(e);
  }

  let data = streamData?.[0]?.[1];
  if (!data?.length) {
    return 'No logs, skipped.';
  }

  let lastId = data.pop()?.[0];
  lastId = parseInt(lastId) + 1;

  await redisClient.xtrim(streamName, 'MINID', lastId);

  try {
    data = data.map(([_, val]) => JSON.parse(val?.[1])).filter(d => d?.requestId);
  } catch (e) {
    return apiError('Parse data error!');
  }

  const input = data.reduce((acc, event) => {
    const curRequestId = event.requestId;
    let { requests, events } = acc;

    if (!requests?.[curRequestId] && event.userId) {
      requests[curRequestId] = {
        request_id: curRequestId,
        user_id: event.userId,
        datasource_id: event.dataSourceId,
      }
    }

    let query;
    let querySql;
    if (event?.query) {
      if (typeof (event.query) === 'object') {
        query = JSON.stringify(event.query);
      }
    }

    if (event.sqlQuery) {
      querySql = event.sqlQuery?.sql?.[0];
    }

    const queryKey = event?.queryKey ? JSON.stringify(event?.queryKey) : null;
    const queryKeyMd5 = queryKey ? createMd5Hex(queryKey) : null;
    let timestamp = event.time;

    if (timestamp) {
      if (typeof (event.time) === 'number') {
        timestamp = new Date(event.time).toISOString();
      }
    }

    events.push({
      request_id: curRequestId,
      event: event?.event,
      duration: event?.duration,
      query,
      query_key: queryKey,
      query_sql: querySql,
      query_key_md5: queryKeyMd5,
      queue_prefix: event?.queuePrefix,
      time_in_queue: event?.timeInQueue,
      path: event?.path, 
      timestamp,
    });

    return {
      requests,
      events,
    };
  }, {
    requests: {},
    events: [],
  });

  input.requests = Object.values(input.requests);

  try {
    const res = await fetchGraphQL(createEventLogsMutation, { ...input });
    return res;
  } catch (e) {
    return apiError(e);
  }
};

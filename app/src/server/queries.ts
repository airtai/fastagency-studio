import _ from 'lodash';
import { type DailyStats, type User, type PageViewSource } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type GetDailyStats,
  type GetPaginatedUsers,
  type GetModels,
  type PropertyDependencies,
} from 'wasp/server/operations';
import { FASTAGENCY_SERVER_URL } from './common/constants';

type DailyStatsWithSources = DailyStats & {
  sources: PageViewSource[];
};

type DailyStatsValues = {
  dailyStats: DailyStatsWithSources;
  weeklyStats: DailyStatsWithSources[];
};

export const getDailyStats: GetDailyStats<void, DailyStatsValues> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(401);
  }
  const dailyStats = await context.entities.DailyStats.findFirstOrThrow({
    orderBy: {
      date: 'desc',
    },
    include: {
      sources: true,
    },
  });

  const weeklyStats = await context.entities.DailyStats.findMany({
    orderBy: {
      date: 'desc',
    },
    take: 7,
    include: {
      sources: true,
    },
  });

  return { dailyStats, weeklyStats };
};

type GetPaginatedUsersInput = {
  skip: number;
  cursor?: number | undefined;
  hasPaidFilter: boolean | undefined;
  emailContains?: string;
  subscriptionStatus?: string[];
};
type GetPaginatedUsersOutput = {
  users: Pick<
    User,
    'id' | 'email' | 'username' | 'lastActiveTimestamp' | 'hasPaid' | 'subscriptionStatus' | 'stripeId'
  >[];
  totalPages: number;
};

export const getPaginatedUsers: GetPaginatedUsers<GetPaginatedUsersInput, GetPaginatedUsersOutput> = async (
  args,
  context
) => {
  let subscriptionStatus = args.subscriptionStatus?.filter((status) => status !== 'hasPaid');
  subscriptionStatus = subscriptionStatus?.length ? subscriptionStatus : undefined;

  const queryResults = await context.entities.User.findMany({
    skip: args.skip,
    take: 10,
    where: {
      email: {
        contains: args.emailContains || undefined,
        mode: 'insensitive',
      },
      hasPaid: args.hasPaidFilter,
      subscriptionStatus: {
        in: subscriptionStatus || undefined,
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      lastActiveTimestamp: true,
      hasPaid: true,
      subscriptionStatus: true,
      stripeId: true,
    },
    orderBy: {
      id: 'desc',
    },
  });

  const totalUserCount = await context.entities.User.count({
    where: {
      email: {
        contains: args.emailContains || undefined,
      },
      hasPaid: args.hasPaidFilter,
      subscriptionStatus: {
        in: subscriptionStatus || undefined,
      },
    },
  });
  const totalPages = Math.ceil(totalUserCount / 10);

  return {
    users: queryResults,
    totalPages,
  };
};

type GetModelsInput = {
  property_type?: string;
};
type PropertyValues = {
  api_key: string;
  property_name: string;
  property_type: string;
  user_id: number;
  uuid: string;
};

type GetModelsValues = {
  secret?: PropertyValues[];
  llm?: PropertyValues[];
  agent?: PropertyValues[];
};

export const getModels: GetModels<GetModelsInput, GetModelsValues | PropertyValues[]> = async (_args, context) => {
  try {
    let data: { user_id: any; property_type?: string } = { user_id: context.user.id };
    if (_.has(_args, 'property_type')) {
      data.property_type = _args.property_type;
    }
    const response = await fetch(`${FASTAGENCY_SERVER_URL}/user/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json: any = (await response.json()) as { detail?: string }; // Parse JSON once

    if (!response.ok) {
      const errorMsg = json.detail || `HTTP error with status code ${response.status}`;
      console.error('Server Error:', errorMsg);
      throw new Error(errorMsg);
    }

    return json;
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }
};

type PropertyDependenciesInput = {
  properties: string[];
};

type PropertyDependenciesValues = {
  [key: string]: number;
};

export const propertyDependencies: PropertyDependencies<
  PropertyDependenciesInput,
  PropertyDependenciesValues[]
> = async (_args, context) => {
  try {
    let retVal: any = {};
    const promises = _args.properties.map(async function (property: string) {
      if (!property) return;
      const data = { user_id: context.user.id, property_type: property };
      const response = await fetch(`${FASTAGENCY_SERVER_URL}/user/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json: any = (await response.json()) as { detail?: string }; // Parse JSON once

      if (!response.ok) {
        const errorMsg = json.detail || `HTTP error with status code ${response.status}`;
        console.error('Server Error:', errorMsg);
        throw new Error(errorMsg);
      }
      retVal[property] = json.length;
    });

    await Promise.all(promises);
    return retVal;
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }
};

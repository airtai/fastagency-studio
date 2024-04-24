import { v4 as uuidv4 } from 'uuid';
import { type User } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type StripePayment,
  type UpdateCurrentUser,
  type UpdateUserById,
  type GetAvailableModels,
  type ValidateForm,
  type UpdateUserModels,
  type AddUserModels,
  type DeleteUserModels,
} from 'wasp/server/operations';
import Stripe from 'stripe';
import type { StripePaymentResult } from '../shared/types';
import { fetchStripeCustomer, createStripeCheckoutSession } from './payments/stripeUtils.js';
import { TierIds } from '../shared/constants.js';

import { FASTAGENCY_SERVER_URL } from './common/constants';

export const stripePayment: StripePayment<string, StripePaymentResult> = async (tier, context) => {
  if (!context.user || !context.user.email) {
    throw new HttpError(401);
  }

  let priceId;
  if (tier === TierIds.HOBBY) {
    priceId = process.env.HOBBY_SUBSCRIPTION_PRICE_ID!;
  } else if (tier === TierIds.PRO) {
    priceId = process.env.PRO_SUBSCRIPTION_PRICE_ID!;
  } else {
    throw new HttpError(400, 'Invalid tier');
  }

  let customer: Stripe.Customer;
  let session: Stripe.Checkout.Session;
  try {
    customer = await fetchStripeCustomer(context.user.email);
    session = await createStripeCheckoutSession({
      priceId,
      customerId: customer.id,
    });
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }

  await context.entities.User.update({
    where: {
      id: context.user.id,
    },
    data: {
      checkoutSessionId: session.id,
      stripeId: customer.id,
    },
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};

export const updateUserById: UpdateUserById<{ id: number; data: Partial<User> }, User> = async (
  { id, data },
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403);
  }

  const updatedUser = await context.entities.User.update({
    where: {
      id,
    },
    data,
  });

  return updatedUser;
};

export const updateCurrentUser: UpdateCurrentUser<Partial<User>, User> = async (user, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.User.update({
    where: {
      id: context.user.id,
    },
    data: user,
  });
};

export const getAvailableModels: GetAvailableModels<void, any> = async (user, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  try {
    const response = await fetch(`${FASTAGENCY_SERVER_URL}/models/llms/schemas`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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

type AddModelsValues = {
  userId: number;
  model: string;
  base_url: string;
  api_type: string;
  api_version?: string;
};

type AddUserModelsPayload = {
  data: AddModelsValues;
};

export const addUserModels: AddUserModels<AddUserModelsPayload, void> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  try {
    const response = await fetch(`${FASTAGENCY_SERVER_URL}/models/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: context.user.id, ...args.data }),
    });
    const json: any = (await response.json()) as { detail?: string }; // Parse JSON once

    if (!response.ok) {
      const errorMsg = json.detail || `HTTP error with status code ${response.status}`;
      console.error('Server Error:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }
};

type UpdateUserModelsValues = {
  userId: number;
  model: string;
  base_url: string;
  api_type: string;
  api_version?: string;
  uuid: string;
};

type UpdateUserModelsPayload = {
  data: UpdateUserModelsValues;
  uuid: string;
};

export const updateUserModels: UpdateUserModels<UpdateUserModelsPayload, void> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  try {
    const response = await fetch(`${FASTAGENCY_SERVER_URL}/models/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: context.user.id, ...args.data, uuid: args.uuid }),
    });
    const json: any = (await response.json()) as { detail?: string }; // Parse JSON once

    if (!response.ok) {
      const errorMsg = json.detail || `HTTP error with status code ${response.status}`;
      console.error('Server Error:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }
};

type DeleteUserModelsPayload = {
  uuid: string;
};

export const deleteUserModels: DeleteUserModels<DeleteUserModelsPayload, void> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  try {
    const response = await fetch(`${FASTAGENCY_SERVER_URL}/models/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: context.user.id, uuid: args.uuid }),
    });
    const json: any = (await response.json()) as { detail?: string }; // Parse JSON once

    if (!response.ok) {
      const errorMsg = json.detail || `HTTP error with status code ${response.status}`;
      console.error('Server Error:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }
};

export const validateForm: ValidateForm<{ data: any; validationURL: string }, any> = async (
  { data, validationURL }: { data: any; validationURL: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  try {
    if (!data.uuid) data.uuid = uuidv4();
    const response = await fetch(`${FASTAGENCY_SERVER_URL}/${validationURL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await response.json();
    if (!response.ok) {
      throw new HttpError(
        response.status,
        JSON.stringify(json.detail) || `HTTP error with status code ${response.status}`
      );
    }
    return data;
  } catch (error: any) {
    throw new HttpError(error.statusCode || 500, error.message || 'Server or network error occurred');
  }
};

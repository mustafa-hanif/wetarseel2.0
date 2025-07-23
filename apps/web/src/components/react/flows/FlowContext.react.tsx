// @ts-nocheck
'use client';

import { createContext, ReactNode } from 'react';

// Type definitions matching the legacy app
export interface IImageWithUrl {
  id: string;
  name: string;
  url: string;
  [key: string]: any;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  [key: string]: any;
}

export const FlowContext = createContext<{
  agents: Partial<User>[];
  images: IImageWithUrl[];
  accountId: string;
  currentUser: User;
}>({
  images: [],
  agents: [],
  accountId: '',
  currentUser: {} as User,
});

export const FlowProvider = ({
  children,
  agents,
  images,
  accountId,
  currentUser,
}: {
  children: ReactNode;
  agents: Partial<User>[];
  images: IImageWithUrl[];
  accountId: string;
  currentUser: User;
}) => {
  return <FlowContext.Provider value={{ images, agents, accountId, currentUser }}>{children}</FlowContext.Provider>;
};

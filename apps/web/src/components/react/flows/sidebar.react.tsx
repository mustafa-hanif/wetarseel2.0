// @ts-nocheck
import React from "react";
import {
  Clock,
  MessageCircle,
  MessageSquare,
  Save,
  UserCog,
} from "lucide-react";
import {
  ServiceMessage,
  SelectKeywords,
  AssignAgent,
  SaveData,
  DataNode,
  ButtonNode,
  OfficeHour,
} from "./NodeComponents.react";
import { ITrigger, IAction, ICondition } from "./useNodeUtils";

export const triggers: {
  icon: JSX.Element;
  label: ITrigger;
}[] = [
  {
    icon: <MessageCircle />,
    label: "On Message",
  },
];

export const conditions: {
  icon: JSX.Element;
  label: ICondition;
}[] = [
  {
    icon: <Clock />,
    label: "Office Hours",
  },
];

export const actions: {
  icon: JSX.Element;
  label: IAction;
}[] = [
  {
    icon: <MessageSquare />,
    label: "Send Message",
  },
  {
    icon: <UserCog />,
    label: "Assign agent",
  },
  {
    icon: <Save />,
    label: "Save Data",
  },
  {
    icon: <Save />,
    label: "Data Node",
  },
];

export const nodeTypes: {
  [key in ITrigger | IAction | ICondition]: any;
} = {
  "Send Message": ServiceMessage,
  "Data Node": DataNode,
  "Assign agent": AssignAgent,
  button: ButtonNode,
  "Save Data": SaveData,
  "On Message": SelectKeywords,
  "Office Hours": OfficeHour,
};

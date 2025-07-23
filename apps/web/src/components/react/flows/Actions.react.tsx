// @ts-nocheck
import { Button } from '../ui/button.react';
import useNodeUtils, { IAction } from './useNodeUtils';

export const Actions = ({
  actions,
}: {
  actions: {
    icon: JSX.Element;
    label: IAction;
  }[];
}) => {
  const { genericClick } = useNodeUtils();
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex-1">
        <h1 className="font-semibold text-lg">Actions</h1>
        <div className="text-sm text-gray-500">Actions to perform</div>
      </div>
      <div>
        {actions.map((action) => {
          return (
            <Button
              onClick={() => genericClick(action.label)}
              variant="trigger"
              className="flex gap-2 items-center mb-2 text-md font-normal pl-1"
              key={action.label}
            >
              <div className="border bg-lime-50 p-1 border-lime-300 rounded-md text-lime-700">{action.icon}</div>
              <div>{action.label}</div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

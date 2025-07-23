// @ts-nocheck
import { Button } from '../ui/button.react';
import useNodeUtils, { ITrigger } from './useNodeUtils';

export const Triggers = ({
  triggers,
}: {
  triggers: {
    icon: JSX.Element;
    label: ITrigger;
  }[];
}) => {
  const { genericClick } = useNodeUtils();
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex-1">
        <h1 className="font-semibold text-lg">Triggers</h1>
        <div className="text-sm text-gray-500">Select trigger</div>
      </div>
      <div>
        {triggers.map((trigger) => {
          return (
            <Button
              onClick={() => genericClick(trigger.label)}
              variant="trigger"
              className="flex gap-2 items-center mb-2 text-md font-normal pl-1"
              key={trigger.label}
            >
              <div className="border bg-lime-50 p-1 border-lime-300 rounded-md text-lime-700">{trigger.icon}</div>
              <div>{trigger.label}</div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

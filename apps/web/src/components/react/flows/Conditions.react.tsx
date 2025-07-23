// @ts-nocheck
import { Button } from '../ui/button.react';
import useNodeUtils, { ICondition } from './useNodeUtils';

export const Conditions = ({
  conditions,
}: {
  conditions: {
    icon: JSX.Element;
    label: ICondition;
  }[];
}) => {
  const { genericClick } = useNodeUtils();
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex-1">
        <h1 className="font-semibold text-lg">Conditions</h1>
        <div className="text-sm text-gray-500">Conditions to check</div>
      </div>
      <div>
        {conditions.map((condition) => {
          return (
            <Button
              disabled
              onClick={() => genericClick(condition.label)}
              variant="trigger"
              className="block mb-2 text-md font-normal text-left pl-1"
              key={condition.label}
            >
              <div className="flex items-center gap-2">
                <div className="border inline-block bg-lime-50 p-1 border-lime-300 rounded-md text-lime-700">{condition.icon}</div>
                <div>{condition.label}</div>
              </div>
              <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded ml-2">coming soon</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

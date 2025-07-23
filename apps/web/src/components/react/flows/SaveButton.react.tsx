// @ts-nocheck
import React from 'react';
import { Button } from '../ui/button.react';

export const SaveButton = ({ 
  accountId, 
  selectedAutomation 
}: { 
  accountId: string; 
  selectedAutomation?: any; 
}) => {
  const handleSave = () => {
    // Placeholder save functionality
    console.log('Saving automation...', { accountId, selectedAutomation });
    alert('Save functionality will be implemented with backend integration');
  };

  return (
    <Button onClick={handleSave} className="px-6">
      {selectedAutomation ? 'Update' : 'Save'} Automation
    </Button>
  );
};

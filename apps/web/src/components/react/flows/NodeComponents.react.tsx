// @ts-nocheck
import React from 'react';

// Basic node component for Send Message
export const ServiceMessage = ({ data }: any) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="font-semibold text-sm mb-2">Send Message</div>
      <textarea 
        placeholder="Enter message text..."
        className="w-full h-20 text-sm border border-gray-200 rounded p-2 resize-none"
        defaultValue={data?.text || ''}
      />
    </div>
  );
};

// Basic node component for selecting keywords
export const SelectKeywords = ({ data }: any) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="font-semibold text-sm mb-2">On Message</div>
      <input 
        type="text"
        placeholder="Enter keywords..."
        className="w-full text-sm border border-gray-200 rounded p-2"
        defaultValue={data?.keywords?.map((k: any) => k.label).join(', ') || ''}
      />
    </div>
  );
};

// Basic node component for Assign Agent
export const AssignAgent = ({ data }: any) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="font-semibold text-sm mb-2">Assign Agent</div>
      <select className="w-full text-sm border border-gray-200 rounded p-2">
        <option>Select Agent...</option>
        <option>Agent 1</option>
        <option>Agent 2</option>
      </select>
    </div>
  );
};

// Basic node component for Save Data
export const SaveData = ({ data }: any) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="font-semibold text-sm mb-2">Save Data</div>
      <input 
        type="text"
        placeholder="Data key..."
        className="w-full text-sm border border-gray-200 rounded p-2 mb-2"
      />
      <input 
        type="text"
        placeholder="Data value..."
        className="w-full text-sm border border-gray-200 rounded p-2"
      />
    </div>
  );
};

// Basic node component for Data Node
export const DataNode = ({ data }: any) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="font-semibold text-sm mb-2">Data Node</div>
      <textarea 
        placeholder="Enter data..."
        className="w-full h-16 text-sm border border-gray-200 rounded p-2 resize-none"
      />
    </div>
  );
};

// Basic node component for Button
export const ButtonNode = ({ data }: any) => {
  return (
    <div className="bg-blue-50 border border-blue-300 rounded-lg p-2 min-w-[100px]">
      <input 
        type="text"
        placeholder="Button text..."
        className="w-full text-sm bg-transparent border-none outline-none text-center"
        defaultValue={data?.label || 'Button'}
      />
    </div>
  );
};

// Basic node component for Office Hours
export const OfficeHour = ({ data }: any) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="font-semibold text-sm mb-2">Office Hours</div>
      <select className="w-full text-sm border border-gray-200 rounded p-2">
        <option>During office hours</option>
        <option>Outside office hours</option>
      </select>
    </div>
  );
};

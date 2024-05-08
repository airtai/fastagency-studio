import React, { useState, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import { use } from 'chai';

export const handlePrintSelected = (selectedItems: string[], smartSuggestionOnClick: CallableFunction) => {
  if (selectedItems.length > 0) {
    if (selectedItems.length > 0) {
      const msg = `Let's proceed with the following ${
        selectedItems.length > 1 ? 'choices' : 'choice'
      }:\n- ${selectedItems.join('\n- ')}`;
      smartSuggestionOnClick(msg);
    }
  }
};

export default function SmartSuggestionCheckbox({
  suggestions,
  smartSuggestionOnClick,
  chatType,
  userSelectedActionMessage,
}: {
  suggestions: string[];
  smartSuggestionOnClick: any;
  chatType?: string | null;
  userSelectedActionMessage?: string | null;
}) {
  const [selectedItems, setSelectedItems] = useState([]);

  const handleCheckboxChange = (event: any) => {
    const suggestion = event.target.value;
    if (event.target.checked) {
      // @ts-ignore
      setSelectedItems([...selectedItems, suggestion]);
    } else {
      setSelectedItems(selectedItems.filter((selected) => selected !== suggestion));
    }
  };

  useEffect(() => {
    if (userSelectedActionMessage) {
      // @ts-ignore
      setSelectedItems([...selectedItems, userSelectedActionMessage]);
    }
  }, [userSelectedActionMessage]);

  return (
    <div className='pb-4 flex items-center group bg-airt-font-base'>
      <div
        style={{ maxWidth: '800px', margin: 'auto' }}
        className={`fade-in  relative ml-3 block w-full px-4 rounded-lg bg-airt-font-base `}
      >
        {chatType === 'daily_analysis' && <hr className=' bg-gray-200 border-1' />}
        {chatType === 'daily_analysis' && (
          <p className='block text-bold text-airt-font-base' style={{ margin: '20px 0' }}>
            <b>
              If you've made a selection through email, the option is pre-selected but can be changed. You can opt for
              all or just a few options as desired, and then click the send button. Alternatively, you can type your own
              responses in the input field below.
            </b>
          </p>
        )}
        <div className='ml-6 chat-conversations text-base flex flex-col'>
          {suggestions.map((suggestion, index) => (
            <label key={index} className='flex items-center me-4'>
              <input
                type='checkbox'
                value={suggestion}
                onChange={handleCheckboxChange}
                // @ts-ignore
                checked={selectedItems.includes(suggestion)}
                className='accent-pink-300 rounded-sm accent-airt-primary'
              />
              <span className='ml-2 mt-1 text-airt-font-base'>{suggestion}</span>
            </label>
          ))}
        </div>
        <button
          onClick={(event) => {
            event.preventDefault();
            handlePrintSelected(selectedItems, smartSuggestionOnClick);
          }}
          className={`${
            selectedItems.length > 0 ? '' : 'bg-gray-400 cursor-not-allowed hover:bg-gray-500'
          }  ml-6 mt-3 bg-airt-primary hover:opacity-90 font-medium rounded-lg text-sm px-3 py-2 m-1 text-airt-font-base`}
        >
          Send
        </button>
        {chatType !== 'daily_analysis' && (
          <p className='my-2 ml-6 pt-2 text-airt-font-base'>
            You can select an option from the list above and click the send button, or type your own responses in the
            input field below.
          </p>
        )}
      </div>
    </div>
  );
}

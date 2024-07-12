import { expect, describe, it } from 'vitest';
import { getSelectOptions } from '../components/form/SelectInput';

describe('getSelectOptions', () => {
  it('Generate options without refs', () => {
    const options = ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'];
    const propertyTypes = null;
    const selectOptions = getSelectOptions(options, propertyTypes);

    expect(selectOptions).toEqual([
      { value: 'claude-3-5-sonnet-20240620', label: 'claude-3-5-sonnet-20240620' },
      { value: 'claude-3-opus-20240229', label: 'claude-3-opus-20240229' },
    ]);
  });
  it('Generate options with refs', () => {
    const options = ['None'];
    const propertyTypes = ['secret'];
    const selectOptions = getSelectOptions(options, propertyTypes);

    expect(selectOptions).toEqual([
      { value: 'None', label: 'None' },
      { value: 'secret', label: "+ Add new 'Secret'" },
    ]);
  });
});

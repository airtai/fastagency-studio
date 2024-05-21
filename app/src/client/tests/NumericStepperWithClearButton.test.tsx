import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { NumericStepperWithClearButton } from '../components/form/NumericStepperWithClearButton';

const renderNumericStepper = (value: any, onChange: any, formElementObject = {}) => {
  return render(
    <NumericStepperWithClearButton
      id='test-numeric-stepper'
      value={value}
      onChange={onChange}
      formElementObject={formElementObject}
    />
  );
};

describe('NumericStepperWithClearButton', () => {
  test('renders and updates value on user interaction with complex formElementObject', () => {
    const mockChangeHandler = vi.fn();
    const formElementObject = {
      default: '10',
      description: 'Age',
      enum: ['5', '10', '15'],
      title: 'Select Age',
      type: 'number',
    };

    const { getByPlaceholderText } = renderNumericStepper(5, mockChangeHandler, formElementObject);

    // Check if component renders with correct placeholder based on description and default value
    const placeholderText = "Age. Enter a number or 'Clear' to use the default value '10'.";
    expect(getByPlaceholderText(placeholderText)).toBeInTheDocument();

    // Simulate user changing value
    const input = screen.getByTestId('numeric-stepper');
    fireEvent.change(input, { target: { value: '15' } });
    expect(mockChangeHandler).toHaveBeenCalledWith(15);
    expect(input).toHaveValue(15);

    // Test clear functionality
    const button = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(button);
    expect(mockChangeHandler).toHaveBeenCalledWith(null);
    expect(input).toHaveValue(null);
  });
});

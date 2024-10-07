import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Controller, useForm } from 'react-hook-form';
import MultiTagInput from './MultiTagInput';

const MultiTagBoundToFormControl = () => {
  const { setValue, control } = useForm({});
  return (
    <Controller
      name="test"
      control={control}
      render={({ field: { value } }) => (
        <MultiTagInput
          fieldValueArr={value}
          field="test"
          disabled={false}
          label="TestLabel"
          setFormValue={setValue}
        />
      )}
    />
  );
};

describe('setup for multi tag component', () => {
  it('render & delete the tags', () => {
    render(<MultiTagBoundToFormControl />);

    // it renders with empty stack i.e. no tags added
    const multiTagStack = screen.getByTestId('test-multi-tag-stack');
    expect(multiTagStack.childElementCount).toBe(0);

    // Add a tag
    const multiTag: any = screen.getByTestId('test-multi-tag');
    const multiTagInput: HTMLInputElement = within(multiTag).getByRole('textbox');
    fireEvent.change(multiTagInput, { target: { value: 'tag1' } });
    // expect text box to have the input
    expect(multiTagInput.value).toBe('tag1');

    // Save the tag and check the count of tags in input
    fireEvent.keyDown(multiTagInput, { key: 'Enter' });
    expect(multiTagStack.childElementCount).toBe(1);

    // Add another tag
    fireEvent.change(multiTagInput, { target: { value: 'tag2' } });
    expect(multiTagInput.value).toBe('tag2');
    fireEvent.keyDown(multiTagInput, { key: 'Enter' });
    expect(multiTagStack.childElementCount).toBe(2);

    // Check the tags text value
    const tags = within(multiTagStack).getAllByRole('button');
    expect(tags[0].children[0].innerHTML).toBe('tag1');
    expect(tags[1].children[0].innerHTML).toBe('tag2');

    // Delete a tag
    let tagCloseButton = tags[0].children[1];
    fireEvent.click(tagCloseButton);
    expect(multiTagStack.childElementCount).toBe(1);

    // Delete another tag. No tags should be left
    tagCloseButton = tags[0].children[1];
    fireEvent.click(tagCloseButton);
    expect(multiTagStack.childElementCount).toBe(0);
  });
});

import React from 'react';
import { Form, Select, Tag, Tooltip } from 'antd';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';

interface ICustomSelectInputProps {
  options: string[]| null;
  name: string | (string | number)[];
  label?: string;
  placeholder: string;
  tagColor?: string;
  mode?: 'multiple' | 'tags';
  showArrow?: boolean;
  required?: boolean;
  className?: string;
  responsive?: boolean;
  disabled?: boolean;
  bordered?: boolean;
  handleSave: (record: any) => void;
  record: any;
}

const renderExtraTags = (tags: string[]) => {
    const omittedValues = (
        <Tooltip title={tags.join(", ")} trigger={["hover", "focus"]}>
          <Tag color={'#5c7784'}>+{tags.length}</Tag>
        </Tooltip>
    );
    if( tags.length > 0 ) {
      return [ omittedValues ]
    }
  }

const tagRender = (props: CustomTagProps, color?: string) => {
  const { label, closable, onClose } = props;
  //console.log((label??'').toString()?.length)
  const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <Tag
      color={color ?? '#5c7784'}
      onMouseDown={onPreventMouseDown}
      closable={closable}
      onClose={onClose}
      style={{ marginRight: 3 }}
    >
      {(label??'').toString()?.length > 25 ? <Tooltip title={label} trigger={["hover", "focus"]}>{`${label?.toString()?.slice(0,25)}...`}</Tooltip> : label}
    </Tag>
  );
};

const CustomSelectInput: React.FC<ICustomSelectInputProps> = ({
  options,
  name,
  label,
  placeholder,
  tagColor,
  mode = 'multiple',
  showArrow = true,
  required = false,
  className = '',
  responsive = false,
  disabled = false,
  bordered = false,
  handleSave,
  record
}) => {
  //console.log(options,"options-customSelectInput");
  return (
    <Form.Item name={name} required={required} rules={[{required:required, message:`${label} is required`}]}>
      <Select
        className={className??null}
        showSearch
        mode={mode}
        defaultValue={options ?? []}
        filterOption={(input, option) =>
          (option?.titleLabelText ?? "")
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        tagRender={(props) => tagRender(props, tagColor)}
        maxTagCount={ responsive ? "responsive" : undefined}
        maxTagPlaceholder={(omittedValues) => {
          if(omittedValues.length > 0){
            let stringValues = omittedValues.map( each => each.label?.toString() as string )
            return renderExtraTags(stringValues)
          }
        }}
        placeholder={placeholder}
        showArrow={true}
        loading={!options}
        aria-label={label}
        title={label??undefined}
        notFoundContent={mode === 'multiple' && null}
        optionFilterProp='label'
        options={(options ?? []).map((value) => ({
          value: value,
          label: value,
          titleLabelText: `${value}`
        }))}
        disabled={disabled}
        bordered={!bordered}
      />
    </Form.Item>
  );
};

export default CustomSelectInput;

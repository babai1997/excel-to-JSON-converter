import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Checkbox, Form, Input, Select, Table, Tag, Button, Dropdown } from 'antd';
import { excelToJson } from '../utils/excelToJson';

type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  question: string;
  answer: string;
  category: string;
}

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[{ required: true, message: `${title} is required.` }]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingInlineEnd: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

interface DataType {
    key: number;
    possibleOptions: string[];
    question: string;
    questionType: string;
    variableName: string;
}

type ColumnTypes = Exclude<TableProps<DataType>['columns'], undefined>;

const TableQuestionMap: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [count, setCount] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState<Record<number, boolean>>({});
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [filteredData, setFilteredData] = useState<DataType[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await excelToJson(file);
        const sheetData = data[Object.keys(data)[1]];
        const formattedData = sheetData.map((item: any, index: number) => ({
          key: item["Order"],
          possibleOptions: item["Possible Options"]?.split('||').map((opt: string) => opt.trim()) || [],
          question: item["Question"] || '',
          questionType: item["Question Type"] || '',
          variableName: item["Variable Name"] || '',
        }));
        setDataSource(formattedData);
        setFilteredData(formattedData);
        setCount(formattedData.length);

        // Set initial column mappings
        const initialMappings: Record<string, string> = {};
        Object.keys(formattedData[0] || {}).forEach(key => {
          initialMappings[key] = key;
        });
        setColumnMappings(initialMappings);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  const handleDropdownVisibleChange = (key: number, open: boolean) => {
    setDropdownVisible((prev) => ({ ...prev, [key]: open }));
  };

  const handleTagClose = (e: React.MouseEvent<HTMLElement>, onClose: () => void, key: number) => {
    onClose();
    setDropdownVisible((prev) => ({ ...prev, [key]: false }));
  };

  const handleValidateAndProceed = () => {
    console.log('Table Data:', dataSource);
    console.log('Column Mappings:', columnMappings);
  };

  const handleColumnMapping = (columnKey: string, mappedValue: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [columnKey]: mappedValue
    }));

    // Filter data based on mapping
    const newFilteredData = dataSource.filter(item => {
      return item[columnKey as keyof DataType]?.toString().includes(mappedValue);
    });
    setFilteredData(newFilteredData);
  };

  const renderColumnTitle = (dataIndex: string) => {
    const mappingOptions = dataSource.length > 0 ? Object.keys(dataSource[0]) : [];
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Select
          style={{ width: '100%' }}
          placeholder="Map column"
          value={columnMappings[dataIndex] || dataIndex}
          onChange={(value) => handleColumnMapping(dataIndex, value)}
          dropdownRender={menu => (
            <div>
              {mappingOptions.map(option => (
                <div key={option} style={{ padding: '8px 12px' }}>
                  <Checkbox
                    checked={columnMappings[dataIndex] === option}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleColumnMapping(dataIndex, option);
                      }
                    }}
                  >
                    {option}
                  </Checkbox>
                </div>
              ))}
            </div>
          )}
        />
      </div>
    );
  };

  const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
    {
      title: renderColumnTitle('key'),
      dataIndex: 'key',
      width: '10%',
      editable: false,
    },
    {
      title: renderColumnTitle('question'),
      dataIndex: 'question',
      width: '30%',
      editable: true,
    },
    {
      title: renderColumnTitle('questionType'),
      dataIndex: 'questionType', 
      width: '20%',
      editable: false,
      render: (_: string, record: DataType) => {
        const options = ['BIN', 'CAT-ME', 'CAT-CA'];
        return (
          <Select
            style={{ width: '100%' }}
            defaultValue={record.questionType}
            onChange={(value) => {
              handleSave({
                ...record,
                questionType: value
              });
            }}
          >
            {options.map(option => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>
        );
      }
    },
    {
      title: renderColumnTitle('variableName'),
      dataIndex: 'variableName', 
      width: '20%',
      editable: true,
    },
    {
      title: renderColumnTitle('possibleOptions'),
      dataIndex: 'possibleOptions',
      width: '20%',
      editable: false,
      render: (options: string[], record: DataType) => {
        const optionsArray = Array.isArray(options) ? options : [];

        const handleChange = (selectedOptions: string[]) => {
          const newOptions = selectedOptions;
          handleSave({
            ...record,
            possibleOptions: newOptions
          });
        };

        return (
          <div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select options" 
              value={optionsArray}
              onChange={handleChange}
              onDropdownVisibleChange={(open) => handleDropdownVisibleChange(record.key, open)}
              open={dropdownVisible[record.key] || false}
              tagRender={(props) => {
                const { label, closable, onClose } = props;
                return (
                  <Tag
                    style={{ margin: '2px' }}
                    closable={closable}
                    onClose={(e) => handleTagClose(e, onClose, record.key)}
                  >
                    {label}
                  </Tag>
                );
              }}
            >
              {optionsArray.map((option: string) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </div>
        );
      }
    },
  ];

  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
    setFilteredData(newData);
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div><input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ marginBottom: 16 }} /></div>
      <Table<DataType>
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={filteredData}
        columns={columns as ColumnTypes}
        pagination={false}
        scroll={{ y: 'calc(100vh - 250px)' }}
        sticky={{ offsetHeader: 0, offsetScroll: 0 }}
        footer={() => (
          <div style={{ textAlign: 'right', position: 'sticky', bottom: 0, background: '#fff', padding: '10px 0' }}>
            <Button type="primary" onClick={handleValidateAndProceed}>
              Validate and Proceed
            </Button>
          </div>
        )}
      />
    </div>
  );
};

export default TableQuestionMap;

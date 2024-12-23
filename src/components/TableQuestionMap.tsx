import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Checkbox, Form, Input, Select, Table, Tag, Button } from 'antd';
import { excelToJson } from '../utils/excelToJson';
import CustomSelectInput from './CustomSelectInput';
type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  order: string;
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
  dataSource: DataType[];
  handleSave: (record: Item) => void;
  validateOrder?: (value: string, currentKey: string) => boolean;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  validateOrder,
  dataSource,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    setValidationError('');
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;    
    if (dataIndex === 'order') {
      if (validateOrder) {
        // Check hierarchical validation during input
        //validateHierarchicalOrder(value, dataSource, record.key);
        const orderExists = validateOrder(value, record.key);
        if (orderExists) {
          setValidationError('This order number already exists');
          return;
        }
      }
    }
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      
      // Final validation check before saving
      if (dataIndex === 'order') {
        if (validateOrder && validateOrder(values.order, record.key)) {
          return;
        }
        // Additional hierarchical validation
        // if (!validateHierarchicalOrder(values.order, dataSource, record.key)) {
        //   return;
        // }
      }

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <div>
        <Form.Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={[{ required: true, message: `${dataIndex} is required.` }]}
        >
          <Input 
            ref={inputRef} 
            onPressEnter={save} 
            onBlur={save} 
            onChange={handleChange}
          />
        </Form.Item>
        {validationError && <div style={{ color: 'red', fontSize: '12px' }}>{validationError}</div>}
      </div>
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

export interface DataType {
    order: string;
    possibleOptions: string[];
    tempOptionsArray: string[];
    question: string;
    questionType: string;
    variableName: string;
    key: string;
}

type ColumnTypes = Exclude<TableProps<DataType>['columns'], undefined>;

const TableFooter: React.FC<{ onValidate: () => void }> = ({ onValidate }) => (
  <div style={{ textAlign: 'right', position: 'sticky', bottom: 0 }}>
    <Button type="primary" onClick={onValidate}>
      Validate and Proceed
    </Button>
  </div>
);

const TableQuestionMap: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [filteredData, setFilteredData] = useState<DataType[]>([]);

  const validateOrder = (value: string, currentKey: string): boolean => {
    return dataSource.some(item => item.order === value && item.key !== currentKey);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await excelToJson(file);
        const sheetData = data[Object.keys(data)[3]];

        const formattedData = sheetData.map((item: any, index: number) => {
          const formattedItem: any = { key: `${index}` };
          // Dynamically add all properties from the item
          Object.entries(item).forEach(([key, value]) => {
            // Convert key to camel case
            const camelCaseKey = key.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
            
            // Handle possible options specially if they contain || separator
            if (typeof value === 'string' && value.includes('||')) {
              formattedItem[camelCaseKey] = value.split('||').map((opt: string) => opt.trim());
            } else {
              formattedItem[camelCaseKey] = value;
            }
          });
          return formattedItem;
        });
        console.log(formattedData,"formattedData---");

        setDataSource(formattedData);
        setFilteredData(formattedData);
        // Set initial column mappings
        const initialMappings: Record<string, string> = {};
        Object.keys(formattedData[0] || {}).forEach(key => {
          initialMappings[key] = key;
        });
        console.log(initialMappings,"initialMappings");
        
        setColumnMappings(initialMappings);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  const handleValidateAndProceed = () => {
    console.log('Table Data:', dataSource);
    //console.log('Column Mappings:', columnMappings);
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
    setFilteredData(dataSource);
  };
  
//dataIndex is the key of the column
  const renderColumnTitle = (dataIndex: string) => {
    const mappingOptions = dataSource.length > 0 ? Object.keys(dataSource[0]) : [];
    const displayColumnTitle = (option: string) => {
      switch(option) {
        case 'order':
          return 'Order';
        case 'question':
          return 'Question';
        case 'questionType':
          return 'Question Type';
        case 'variableName':
          return 'Variable Name';
        case 'possibleOptions':
          return 'Possible Options';
        default:
          return option;
      }
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Select
          style={{ width: '100%', border: 'none' }}
          placeholder="Map column"
          value={displayColumnTitle(columnMappings[dataIndex] || dataIndex)}
          onChange={(value) => handleColumnMapping(dataIndex, value)}
          bordered={false}
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
                    {(option)}
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
      title: renderColumnTitle('order'),
      dataIndex: 'order',
      width: '10%',
      editable: true,
    },
    {
      title: renderColumnTitle('questions'),
      dataIndex: 'questions',
      width: '25%',
      editable: true,
    },
    {
      title: renderColumnTitle('questionType'),
      dataIndex: 'questionType', 
      width: '15%',
      editable: false,
      render: (_: string, record: DataType) => {
        const options = ['BIN', 'CAT-ME', 'CAT-CA', 'TEXT', 'NUMBER', 'DATE'];
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
        if (record.questionType === 'TEXT') {
          return null;
        }

        // let optionsArray = Array.isArray(options) ? options : [];
        
        if (record.questionType === 'BIN') {
          const tempOptionsArray = [...record.possibleOptions];
          record.possibleOptions = ['YES', 'NO'];
          record.tempOptionsArray = tempOptionsArray;
          return (
            <>
              {record.possibleOptions.map(option => (
                <Tag 
                  key={option} 
                  color="#5c7784"
                  style={{ marginRight: 3 }}
                >
                  {option}
                </Tag>
              ))}
            </>
          );
        }
        record.possibleOptions = record.tempOptionsArray?.length>0 ? record.tempOptionsArray : record.possibleOptions;

        return (
          <CustomSelectInput
            key={record.key}
            options={Array.isArray(record.possibleOptions) ? record.possibleOptions : []}
            name={`possibleOptions-${record.key}`}
            label="Possible Option tags"
            placeholder={'Add possible options tag'}
            mode="tags"
            showArrow={false}
            handleSave={handleSave}
            record={record}
          />
        );
      }
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      width: '10%',
      fixed: 'right',
      render: (_: any, record: DataType) => (
        <Button 
          type="link" 
          danger
          onClick={() => {
            setDataSource(prev => {
              const newData = [...prev];
              const index = newData.findIndex(item => record.key === item.key);
              newData.splice(index, 1);
              setFilteredData(newData);
              return newData;
            });
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  const handleSave = (row: DataType) => {
    console.log(row,"row---");
    
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    //const item = newData[index];
    newData[index] = row
    // newData.splice(index, 1, {
    //   ...item,
    //   ...row,
    // });
    console.log(newData,"newData---");
    
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
        validateOrder: col.dataIndex === 'order' ? validateOrder : undefined,
        dataSource,
      }),
    };
  });

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <span>
        <input type="file" accept=".xlsm" onChange={handleFileUpload} style={{ marginBottom: 16 }} />
      </span>
      <Table<DataType>
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={filteredData as DataType[]}
        columns={columns as ColumnTypes}
        pagination={false}
        scroll={{ y: 'calc(100vh - 250px)' }}
        sticky={{ offsetHeader: 0, offsetScroll: 0 }}
        footer={() => <TableFooter onValidate={handleValidateAndProceed} />}
        rowKey="key"
      />
    </div>
  );
};

export default TableQuestionMap;

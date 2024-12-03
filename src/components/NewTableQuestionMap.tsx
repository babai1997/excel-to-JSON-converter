import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Checkbox, Form, Input, Select, Table, Tag, Button } from 'antd';
import CustomSelectInput from './CustomSelectInput';
import Output from './Output.json';
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
          return; // Don't save if validation fails
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
    possible_options: string[];
    temp_options_array: string[];
    question: string;
    question_type: string;
    variable_name: string;
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

const snakeToTitle = (str: string) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const initialMappings: Record<string, string> = {
    order: 'order', 
    questions: 'questions', 
    variable_name: 'variable_name', 
    question_type: 'question_type',
    possible_options: 'possible_options',
  };


const NewTableQuestionMap: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(initialMappings);
  const [filteredData, setFilteredData] = useState<DataType[]>([]);

  useEffect(() => {
    //if(!dataSource.length || !filteredData.length){
      console.log("dataSource.length",dataSource.length);
      setDataSource(Output.data as any);
      setFilteredData(Output.data as any);
    //}
  }, []);

  
    // Filter data based on mapping
    const mapFilterDataAsOption = (dataIndex: string, value: string) => {
      setFilteredData((prev) => {
        //console.log(prev,"prev");
        //console.log(dataIndex,value,"dataIndex: order, value: serial_number");
        return prev.map((item) => {
          //console.log(item,"item");
              if (item.hasOwnProperty(value)) {
                console.log(1,"item");
                  const newItem = { ...item }; // Clone the object to avoid direct mutation
                  (newItem as any)[dataIndex] = (item as any)[value]; // Assign new property
                  delete (newItem as any)[value]; // Remove old property
                  //console.log(newItem,"newItem");
                  return newItem;
              }
              return item; // Return unchanged item if condition is not met
          })
      });
      setDataSource(filteredData);
      console.log(filteredData,"filteredData");
      //console.log(columnMappings,"columnMappings");
    }

  const validateOrder = (value: string, currentKey: string): boolean => {
    return dataSource.some(item => item.order === value && item.key !== currentKey);
  };

  const handleValidateAndProceed = () => {
    console.log('Table Data:', dataSource);
    console.log('filteredData',filteredData);
  };

  const handleColumnMapping = (dataIndex: string, mappedValue: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [dataIndex]: mappedValue
    }));
    //console.log(columnMappings,"columnMappings----");
    mapFilterDataAsOption(dataIndex, mappedValue);
  };
  
//dataIndex is the key of the column
  const renderColumnTitle = (dataIndex: string) => {
    const mappingOptions = Output.header.length > 0 ? Output.header.map((header: any) => (header.dataIndex)) : [];
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Select
          style={{ width: '100%', border: 'none' }}
          placeholder="Map column"
          value={(snakeToTitle(dataIndex))}
          onChange={(value) => handleColumnMapping(dataIndex, value)}
          bordered={false}
          dropdownRender={menu => (
            <div>
              {mappingOptions.map(option => (
                <div key={option} style={{ padding: '8px 12px' }}>
                  <Checkbox
                    checked={columnMappings[dataIndex] === (option)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleColumnMapping(dataIndex, option);
                        console.log(columnMappings,"columnMappings");
                      }
                    }}
                  >
                    {snakeToTitle(option)}
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
      title: renderColumnTitle('question_type'),
      dataIndex: 'question_type', 
      width: '15%',
      editable: false,
      render: (_: string, record: DataType) => {
        const options = ['BIN', 'CAT-ME', 'CAT-CA', 'TEXT', 'NUMBER', 'DATE'];
        return (
          <Select
            style={{ width: '100%' }}
            defaultValue={record.question_type}
            onChange={(value) => {
              handleSave({
                ...record,
                question_type: value
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
      title: renderColumnTitle('variable_name'),
      dataIndex: 'variable_name', 
      width: '20%',
      editable: true,
    },
    {
      title: renderColumnTitle('possible_options'),
      dataIndex: 'possible_options', 
      width: '20%',
      editable: false,
      render: (options: string[], record: DataType) => {
        if (record.question_type === 'TEXT') {
          return null;
        }

        if (record.question_type === 'BIN') {
          // Store original options before overwriting
          const tempOptionsArray = [...record.possible_options];
          record.temp_options_array = tempOptionsArray;
          
          // Set binary options
          record.possible_options = ['YES', 'NO'];
          
          return (
            <>
              {record.possible_options.map(option => (
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

        // For non-BIN types, restore original options if temp array exists
        if (record.temp_options_array?.length > 0) {
          console.log(record.temp_options_array,"record.temp_options_array");
          record.possible_options = record.temp_options_array;
        }

        return (
          <CustomSelectInput
            key={record.key}
            options={Array.isArray(record.possible_options) ? record.possible_options : []}
            name={`possible_options-${record.key}`}
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
    //console.log(row,"row---");
    
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    newData[index] = row

    //console.log(newData,"newData---");
    
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
      <Table<DataType>
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={filteredData}
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

export default NewTableQuestionMap;

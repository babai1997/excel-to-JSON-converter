import * as xlsx from 'xlsx';
import { DataType } from '../components/TableQuestionMap';

export function excelToJson(file: File): Promise<Record<string, any[]>> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = xlsx.read(data, { type: 'array' });

            const jsonData: Record<string, any[]> = {};
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                jsonData[sheetName] = xlsx.utils.sheet_to_json(worksheet);
            });

            resolve(jsonData);
            console.log(jsonData);
            
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}











export const validateHierarchicalOrder = (
    value: string,
    dataSource: DataType[] = [],
    currentKey: string,
    setValidationError: (error: string) => void
  ): boolean => {
    console.log("Initial value:", value);
  
    // Trim the value to remove any leading or trailing whitespace
    value = value.trim();
    console.log("Trimmed value:", value);
  
    // Regex to validate order format (e.g., 1, 1.1, 1.2, 1.2.1)
    const orderRegex = /^\d+(\.\d+)*$/;
    console.log("Testing regex:", orderRegex.test(value));
  
    if (!orderRegex.test(value)) {
      setValidationError('Invalid order format.');
      return false;
    }
  
    const parts = value.split('.');
    console.log("Order parts:", parts);
  
    // Check if all parent levels exist
    for (let i = 1; i < parts.length; i++) {
      const parentOrder = parts.slice(0, i).join('.');
      console.log(`Checking if parent order ${parentOrder} exists:`);
      
      // Check if the parent order exists in the dataSource
      const parentExists = dataSource.some(item => item.order === parentOrder);
      if (!parentExists) {
        setValidationError(`Parent order ${parentOrder} must exist before creating ${value}`);
        return false;
      }
    }
  
    // Check for the correct sibling sequence
    const immediateParentOrder = parts.slice(0, -1).join('.');
    const siblingIndex = parseInt(parts[parts.length - 1], 10);
    console.log("Immediate parent order:", immediateParentOrder);
  
    if (immediateParentOrder) {
      // Check all siblings of the immediate parent for proper sequence
      for (let i = 1; i < siblingIndex; i++) {
        const siblingOrder = `${immediateParentOrder}.${i}`;
        const siblingExists = dataSource.some(item => item.order === siblingOrder);
        console.log(`Checking sibling order ${siblingOrder}:`, siblingExists);
  
        if (!siblingExists) {
          setValidationError(`Sibling order ${siblingOrder} must exist before creating ${value}`);
          return false;
        }
      }
    } else {
      // If it's a top-level order, check for its sequence
      const topLevelIndex = parseInt(parts[0], 10);
      for (let i = 1; i < topLevelIndex; i++) {
        const siblingExists = dataSource.some(item => item.order === `${i}`);
        console.log(`Checking top-level sibling order ${i}:`, siblingExists);
  
        if (!siblingExists) {
          setValidationError(`Top-level order ${i} must exist before creating ${value}`);
          return false;
        }
      }
    }
  
    // Ensure the new order doesn't already exist for a different item
    const orderExists = dataSource.some(item => item.order === value && item.key !== currentKey);
    console.log("Order exists in dataSource:", orderExists);
  
    if (orderExists) {
      setValidationError('This order number already exists');
      return false;
    }
  
    // Clear previous errors when validation passes
    setValidationError('');
    return true;
  };
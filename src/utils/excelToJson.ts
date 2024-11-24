import * as xlsx from 'xlsx';

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

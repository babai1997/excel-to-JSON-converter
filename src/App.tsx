import React, { useState } from 'react';
import { excelToJson } from './utils/excelToJson';
import TableQuestionMap from './components/TableQuestionMap';

const App: React.FC = () => {
    const [jsonData, setJsonData] = useState<Record<string, any[]> | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const data = await excelToJson(file);
                setJsonData(data);
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    };

    return (
        <div>
            <h1>Excel to JSON Converter</h1>
            {/* <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} /> */}
            {/* {jsonData && (
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {JSON.stringify(jsonData, null, 4)}
                </pre>
            )} */}
            <TableQuestionMap />
        </div>
    );
};

export default App;

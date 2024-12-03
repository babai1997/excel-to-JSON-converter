import React, { useState } from 'react';
import { excelToJson } from './utils/excelToJson';
import TableQuestionMap from './components/TableQuestionMap';
import NewTableQuestionMap from './components/NewTableQuestionMap';

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
            {/* <TableQuestionMap /> */}
            <NewTableQuestionMap />
        </div>
    );
};

export default App;

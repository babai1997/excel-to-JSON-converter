const xlsx = require('xlsx');
const fs = require('fs');

function excelToJson(filePath) {
  try {
    // Read the workbook
    const workbook = xlsx.readFile(filePath);

    // Get the first worksheet name
    const questionSheetName = workbook.SheetNames[3];

    const jurisdictionSheetName = workbook.SheetNames[4];

    // Get the worksheet data
    const questionWorksheet = workbook.Sheets[questionSheetName];
    const jurisdictionWorksheet = workbook.Sheets[jurisdictionSheetName];

    // Convert worksheet to JSON as an array of arrays
    const questionsData = xlsx.utils.sheet_to_json(questionWorksheet, { header: 1, blankrows: true, defval: "" });
    const jurisdictionsData = xlsx.utils.sheet_to_json(jurisdictionWorksheet, { header: 1, blankrows: true, defval: "" });

     // Filter out rows where all values are empty strings
     const filterEmptyRows = (data) => data.filter(row => row.some(value => value !== ""));

    const filteredQuestionsData = filterEmptyRows(questionsData);
    const filteredJurisdictionsData = filterEmptyRows(jurisdictionsData);

    return { Questions: filteredQuestionsData, Jurisdictions: filteredJurisdictionsData }; // Data as array of arrays (rows and columns)
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return null;
  }
}

// Example usage:
const excelFilePath = "C:/Users/SUDIPTA PRAMANIK/Downloads/Minor Consent Importer Test - DA Modification.xlsm";
const jsonData = excelToJson(excelFilePath);

if (jsonData) {
  fs.writeFileSync('outputFINAL.json', JSON.stringify(jsonData, null, 2));
  console.log('Excel data converted to JSON and saved as output.json');
} else {
  console.log('Failed to convert Excel to JSON');
}

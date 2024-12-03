const fs = require("fs");

function convertToSnakeCase(key) {
    return key.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => '_' + chr).replace(/^_+|_+$/g, '');
}

const convertPipeToArray = (value) => {
    if (value.includes("||"))
      return value.split("||").map((each) => each.trim());
    return value.trim();
  };

const transformQuestions = (data) => {
    const headers = data[0];
    const headerValues = headers.map((header) => {
      return {
        title: header,
        dataIndex: convertToSnakeCase(header),
        key: convertToSnakeCase(header),
      };
    });
    const values = data.slice(1).map((row) => {
      let transformedObject = {};
      headers.forEach((header, index) => {
        transformedObject[convertToSnakeCase(header)] = convertPipeToArray(`${row[index]}`);
      });
      transformedObject.key = `row-${row[0]}`;
      return transformedObject;
    });
    return { header: headerValues, data: values };
  };


const scorecardData = require("./QuestionData.json");
const questionData = transformQuestions(scorecardData);

// Write the output to a file
fs.writeFile(
    "Output.json",
    JSON.stringify(questionData, null, 2),
    (err) => {
        if (err) {
            console.error("Error writing to file", err);
        } else {
            console.log("Data successfully written to jurisdictionTabData.json");
        }
    }
);
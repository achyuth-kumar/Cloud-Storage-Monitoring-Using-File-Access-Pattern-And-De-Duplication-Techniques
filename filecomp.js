const http = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

async function compareFiles(fileOneName,fileLinkOne,fileTwoName,fileLinkTwo) {
    const fileOne = fs.createWriteStream(fileOneName);
    const fileTwo = fs.createWriteStream(fileTwoName);
    let dataOne,dataTwo;
    const requestOne = await http.get(fileLinkOne, function (response) {
        response.pipe(fileOne);

        // after download completed close filestream
        fileOne.on("finish", () => {
            fileOne.close();
            console.log("Download 1 Completed");
        });

        fs.readFile(fileOneName, 'utf8', function (err, data) {
            dataOne = data;
            // Display the file content
            // console.log(data);
        });
    });
    const requestTwo = await http.get(fileLinkTwo, function (response) {
        response.pipe(fileTwo);

        // after download completed close filestream
        fileTwo.on("finish", () => {
            fileTwo.close();
            console.log("Download 2 Completed");
        });

        fs.readFile(fileTwoName, 'utf8', function (err, data) {
            dataTwo = data;
            // Display the file content
            // console.log(data);
        });
    });
}

let linkOne = "https://cms-cloud-files.s3.ap-south-1.amazonaws.com/UI_Path_Certificate1.png";
let linkTwo = "https://cms-cloud-files.s3.ap-south-1.amazonaws.com/UI_Path_Certificate1.png";
compareFiles("UI_Path_Certificate1.png",linkOne,"UI_Path_Certificate1.png",linkTwo);
const { FilesManager } = require('turbodepot-node');
const fs = require('fs');
let filesManager = new FilesManager();
// filesManager.isFileEqualTo('path/to/file1', 'path/to/file2');

let fileStream;
const downloadFile = (async (url, path) => {
    const res = await fetch(url);
    fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
});

async function compareTwoFiles(fileLinkOne, fileLinkTwo) {
    let firstData, secondData;

    await fetch(fileLinkOne)
        .then((data) => data.text())
        .then(async (res) => {
            firstData = res
            await fetch(fileLinkTwo)
                .then((data) => data.text())
                .then((res) => {
                    secondData = res;
                    return firstData === secondData;
                });
        });
}

// fs.writeFile("/tmp/test", fileStream , function(err) {
//     if(err) {
//         return console.log(err);
//     }
//     console.log("The file was saved!");
// }); 

async function abc() {
    let ans = await compareTwoFiles("https://cdn.freecodecamp.org/testable-projects-fcc/v1/bundle.js", "https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js")
    console.log(ans)
}

abc();
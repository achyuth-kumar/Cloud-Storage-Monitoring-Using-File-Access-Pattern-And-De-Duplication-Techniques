let firstData, secondData;
const fetch = require('node-fetch')

// fetch("https://cloud-file-monitoring.herokuapp.com/cdn/629def0fd0f8bf57ac1c35f6")
//     .then((data) => data.text())
//     .then((res) => {
//         firstData = res
//         fetch("https://cloud-file-monitoring.herokuapp.com/cdn/629def1fd0f8bf57ac1c35f8")
//             .then((data) => data.text())
//             .then((res) => {
//                 console.log(res);
//                 secondData = res;
//                 console.log(firstData == secondData);
//             });
//     });

async function compareTwoFiles(fileLinkOne, fileLinkTwo) {
    let firstData, secondData;

    fetch(fileLinkOne)
        .then((data) => data.text())
        .then((res) => {
            firstData = res
            fetch(fileLinkTwo)
                .then((data) => data.text())
                .then((res) => {
                    secondData = res;
                });
        });

    return firstData === secondData;
}

const link1 = "https://cloud-file-monitoring.herokuapp.com/cdn/62a98c9ed6bfbfdd27f065e8"
const link2 = "https://cloud-file-monitoring.herokuapp.com/cdn/62a98cb0d6bfbfdd27f065ec"
async function abc() {
    const ans = await compareTwoFiles(link1,link2)
    console.log(ans)
}

abc();

let PROD_URL = 'https://cloud-file-monitoring.herokuapp.com';
let LOCAL_URL = 'http://localhost:3000';
let FILE_URL = ''
let LINK = '';
let KEY = '';
let ID = '';
async function migrateData(link, key, priority, id) {
    const elem = document.querySelector('.migrationBox');
    LINK = link;
    ID = id;
    KEY = key;
    elem.classList.remove("hidden");
    window.open(link);
}


// 1) Instantiate Upload.js (at start of app).
const upload = new Upload({ apiKey: "public_kW15asVWWm1Y8rzsXTT6tnqisKGj" })

// <input type="file" onchange="onFileSelected(event)" />
async function onFileSelected(event) {
    try {
        // 2) Hide upload button when upload starts.
        uploadButton.remove()

        // 3) Upload file & show progress.
        const [file] = event.target.files
        const { fileUrl } = await upload.uploadFile({
            file,
            onProgress: ({ progress }) =>
                h1.innerHTML = `File uploading... ${progress}%`
        })

        // 4) Display uploaded file URL.
        FILE_URL = fileUrl;
        h1.innerHTML = `
      File uploaded:
      <br/>
      <br/>
      <a href="${fileUrl}" target="_blank">${fileUrl}</a>`

        await fetch(LOCAL_URL + '/migrate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key: KEY,
                id: ID,
                fileUrl: fileUrl
            })
        })
            .then((result) => {
                
            })
            .catch((error) => {
                console.error('Error:', error);
            });

            h1.innerHTML = `
            Migrated Successfully:
            <br/>
            <br/>
            <a href="${fileUrl}" target="_blank">${fileUrl}</a>`

        setTimeout(() => {
            location.reload();
        },5000);

    } catch (e) {
        // 5) Display errors.
        h1.innerHTML = `Error:<br/><br/>${e.message}`
    }
}

async function deDup() {
    await fetch(LOCAL_URL + '/fileleveldeduplication', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then((res) => res.json())
        .then((result) => {
            const element = document.querySelector('#file-text');
            if(result.totalFilesDeleted) {
                element.innerHTML = `De-Duplication Process Completed<br><br>
                                Space Saved : ${result.bytesSaved} bytes<br><br>
                                Total Files Deleted : ${result.totalFilesDeleted} files<br><br>
                                No. of References Created : ${result.totalFilesDeleted}`;
            } else {
                element.innerHTML = `De-Duplication Process Completed<br><br>
                                Space Saved : 0 bytes<br><br>
                                Total Files Deleted : 0 files<br><br>
                                No. of References Created : 0 references`;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}
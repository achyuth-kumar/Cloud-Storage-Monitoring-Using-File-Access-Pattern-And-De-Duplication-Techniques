let PROD_URL = 'https://cloud-file-monitoring.herokuapp.com';
let LOCAL_URL = 'http://localhost:3000';

async function deleteFile(key,id) {
    await fetch(LOCAL_URL+'/deletefile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            key: key,
            id: id
        })
    })
        .then((result) => { 
            console.log(result)
            location.reload()
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

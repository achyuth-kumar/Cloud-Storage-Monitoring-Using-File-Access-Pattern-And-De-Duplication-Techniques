let PROD_URL = 'https://cloud-file-monitoring.herokuapp.com';
let LOCAL_URL = 'http://localhost:3000';

async function updateRank(link, key, priority, id) {
    await fetch(LOCAL_URL+'/updaterank', {
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
            window.open(link) 
            location.reload()
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

let ID;

async function sendOTP(id,i) {
    const otpBox = document.querySelector('.otp-box');
    otpBox.classList.remove('otp-hide');
    await fetch(LOCAL_URL+'/sendotp', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then((result) => { 
            ID = id;
            console.log(".delete"+i)
            document.querySelector("#delete"+i).disabled = true;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

async function checkOTP() {
    const userEnteredOtp = document.getElementById('otp').value;
    // if(parseInt(userEnteredOtp) === OTP231) {
    //     errBox.classList.add('otp-hide')
    //     window.open(link123) 
    //     location.reload()
    // } else {
    //     const errBox = document.querySelector('.err');
    //     errBox.classList.remove('otp-hide')
    //     errBox.textContent = "Wrong OTP entered";
    // }
    await fetch(LOCAL_URL+'/verifyotp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            otp: userEnteredOtp,
            id: ID
        })
    })

        .then((res) => res.json())
        .then((result) => { 
            if(result.success) {
                window.open(result.link) 
                location.reload()
            } else {
                const errBox = document.querySelector('.err');
                errBox.classList.remove('otp-hide')
                errBox.textContent = "Wrong OTP entered";
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}
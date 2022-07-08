require('dotenv').config()
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendMail(email) {
    function generateOTP() {
        var digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 6; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
    }

    const OTP = generateOTP();
    let html = `Thanks for using our application!<br>
    Otp for downloading your file: <b>${OTP}</b><br><br>
                
    Thanks & Regards, <br>
    Cloud Storage Monitoring Team
    `;

    //Mail
    const message = {
        to: email,
        from: {
            name: 'Cloud Storage Monitoring',
            email: 'cloudstoragemonitoring@gmail.com'
        },
        subject: 'CMS: OTP for downloading sensitive files',
        html: html
    }

    sgMail.send(message)
        .then((response) => console.log("Mail Sent"))
        .catch((err) => console.log(err));
    
    return OTP;
}

module.exports = sendMail;
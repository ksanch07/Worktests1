require('dotenv').config();
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS);

async function scrapeData() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.ideality-inc.com/available-trucks/');

    // Scrape the table data
    const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tr'));
        return rows.map(row => {
            const columns = row.querySelectorAll('td');
            return Array.from(columns).map(column => column.innerText);
        });
    });

    await browser.close();
    return data;
}

async function sendEmail(data) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'keoni@flockfreight.com',
        subject: 'Scraped Truck List Data',
        text: JSON.stringify(data)
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

(async () => {
    const data = await scrapeData();
    await sendEmail(data);
})();
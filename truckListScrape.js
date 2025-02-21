require('dotenv').config();
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass:', process.env.EMAIL_PASS);

async function scrapeData() {
    const browser = await puppeteer.launch({ headless: false }); // Set headless to false for debugging
    const page = await browser.newPage();
    await page.goto('https://www.ideality-inc.com/available-trucks/', { waitUntil: 'networkidle2' });

    // Wait for the table to be loaded with increased timeout
    try {
        console.log('Waiting for table to load...');
        await page.waitForSelector('.table-body', { timeout: 120000 }); // Increased timeout to 120 seconds
        console.log('Table loaded.');
    } catch (error) {
        console.error('Error waiting for table:', error);
        await page.screenshot({ path: 'error_screenshot.png' });
        await browser.close();
        throw error;
    }

    // Scrape the table data
    const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.table-body .table-row'));
        return rows.map(row => {
            const columns = row.querySelectorAll('.row-cell');
            return Array.from(columns).map(column => column.innerText.trim());
        });
    });

    console.log('Scraped Data:', data);

    await browser.close();
    return data;
}

async function sendEmail(data) {
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass:', process.env.EMAIL_PASS);

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
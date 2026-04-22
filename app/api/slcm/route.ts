import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(req: Request) {
  try {
    const { slcmId, password } = await req.json();

    if (!slcmId || !password) {
      return NextResponse.json({ success: false, error: "SLCM ID and Password are required" }, { status: 400 });
    }

    // 🚀 SPARTICUZ VERCEL HACK: Dynamically load the correct browser core
    let browser;
    if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
      // Local Mac Execution (Uses standard heavy Puppeteer)
      const localPuppeteer = require('puppeteer');
      browser = await localPuppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
    } else {
      // Cloud Vercel Execution (Uses ultra-compressed Sparticuz Chromium)
      chromium.setGraphicsMode = false;
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }
    
    // Open a new tab
    const page = await browser.newPage();
    
    // Set a realistic user agent so SLCM doesn't block the request immediately thinking it's a simple bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36');

    // 1. Navigate to the MUJ SLCM portal login page
    console.log("Navigating to MUJ SLCM...");
    await page.goto('https://mujslcm.jaipur.manipal.edu/', { waitUntil: 'domcontentloaded', timeout: 60000 }); 

    // Wait a brief moment for any final Javascript logic to settle on their page before typing 
    await new Promise(r => setTimeout(r, 1000));

    // 2. Type the credentials into the HTML input fields
    console.log("Typing credentials...");
    
    // CRITICAL FIX: MUJ SLCM has custom Javascript that strictly forbids typing '@muj.manipal.edu'
    // It will aggressively delete or block the input if we try to send the full email.
    const cleanSlcmId = slcmId.split('@')[0];
    
    await page.type('#txtUserName', cleanSlcmId); 
    await page.type('#txtPassword', password); 

    // 3. Click the Login button and PROPERLY wait for the page to load
    console.log("Clicking Login...");
    
    await Promise.all([
      page.click('#login_submitStudent'),
      // wait for navigation to complete so we don't try to go to the timetable before we're fully logged in
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => console.log('Navigation wait timed out, continuing anyway...'))
    ]);

    // Check if login failed by looking for an error message or seeing if we are still on the login page
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('Login')) {
       await browser.close();
       return NextResponse.json({ success: false, error: "Invalid Credentials" }, { status: 401 });
    }

    // 4. Navigate to the timetable page directly!
    console.log("Navigating to Timetable...");
    // You will need to inspect the SLCM dashboard to find the exact URL of the student timetable page!
    await page.goto('https://mujslcm.jaipur.manipal.edu/Student/Academic/ViewTimeTableForStudent', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for the calendar element to appear just in case it loads slowly
    try {
      await page.waitForSelector('#calendar', { timeout: 10000 });
    } catch (e) {
      console.log("Calendar selector not found. Taking debug screenshot...");
    }

    // 5. Extract REAL Timetable Data via DOM mapping
    let timetableData: any[] = [];
    try {
      await page.waitForFunction(() => document.querySelectorAll('a.fc-time-grid-event').length > 0, { timeout: 15000 });
      timetableData = await page.evaluate(() => {
        const events = Array.from(document.querySelectorAll('a.fc-time-grid-event'));
        return events.map((el, i) => {
          const timeText = el.querySelector('.fc-time')?.getAttribute('data-full') || '';
          const titleText = el.querySelector('.fc-title')?.textContent || '';
          
          let subject = titleText;
          let room = "";
          if (titleText.includes(', Room No :')) {
             subject = titleText.split(', Room No :')[0].replace('BTECH-005 ', '').trim();
             room = "Room No: " + titleText.split(', Room No :')[1].split(',')[0].trim();
          }

          const td = el.closest('td');
          let dayIndex = 0;
          if(td && td.parentNode) {
             dayIndex = Array.from(td.parentNode.children).indexOf(td);
             if (dayIndex > 0) dayIndex -= 1; // offset the axis column which is index 0
          }

          const dayMap = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          return {
            id: i.toString(),
            day: dayMap[dayIndex] || "Monday",
            time: timeText,
            subject: subject,
            room: room
          };
        });
      });
    } catch (e) {
      console.log("Could not dynamically parse timetable events, defaulting to empty array.");
    }

    // 6. Navigate to proper Attendance Summary page and extract REAL data
    console.log("Navigating to Real Attendance Summary...");
    await page.goto('https://mujslcm.jaipur.manipal.edu/Student/Academic/AttendanceSummaryForStudent', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // MUJ uses AJAX to fetch attendance; wait for the #kt_ViewTable rows to populate
    await page.waitForFunction(() => document.querySelectorAll('#kt_ViewTable tr').length > 1, { timeout: 15000 }).catch(() => console.log('Attendance AJAX timeout'));

    let attendanceData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#kt_ViewTable tr'));
      let results: any[] = [];
      rows.forEach((row, i) => {
        const cols = row.querySelectorAll('td');
        if(cols.length >= 10) {
          let courseName = cols[1].textContent?.trim() || '';
          if(courseName.includes(' : ')) courseName = courseName.split(' : ')[1];
          results.push({
            id: 'att' + i,
            subject: courseName,
            totalClasses: parseInt(cols[8].textContent?.trim() || '0', 10),
            attendedClasses: parseInt(cols[6].textContent?.trim() || '0', 10),
            percentage: cols[9].textContent?.trim() + '%'
          });
        }
      });
      return results;
    });

    await browser.close();

    // 7. Return securely formatted data straight to Firebase
    return NextResponse.json({ 
      success: true, 
      timetableData,
      attendanceData
    });

  } catch (error: any) {
    console.error("Scraping failed", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to parse data" }, { status: 500 });
  }
}

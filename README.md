# Henderson ISD Athletics Recruiting Portal - Live Data Version

This version is static and GitHub Pages-ready, but reads data from Google Sheets.

## Setup
1. Make sure your Google Sheet has tabs named `Athletes`, `Updates`, and `Programs`.
2. In Google Sheets, go to **File > Share > Publish to web**.
3. Publish the full document or those tabs.
4. Copy the Sheet ID from the URL.
5. Open `config.js`, paste the Sheet ID, and change `useSampleData` to `false`.
6. Upload all files to GitHub Pages.

## Athlete columns
`id, first_name, last_name, preferred_name, sport, grad_year, position, height, weight, gpa, hometown, photo_url, hudl_link, twitter_link, one_sheet_url, key_stats, bio, coach_name, coach_email, active`

Use a pipe `|` between stat items in `key_stats`.


## v4 notes
- The homepage headline is forced to two lines on desktop: Henderson ISD / Athletics.
- Updates and Programs tabs are now optional. If they are missing, the site uses sample content for those sections while still loading Athletes from the live sheet.
- Google Drive image links are converted to `https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200`.
- If GitHub Pages still looks unchanged after upload, clear browser cache or open the site with `?v=4` added to the URL.

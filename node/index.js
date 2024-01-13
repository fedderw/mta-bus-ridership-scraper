const puppeteer = require('puppeteer') // Include puppeteer for browser automation
const { writeFile } = require('fs').promises // Include writeFile from fs.promises to write files
const cliProgress = require('cli-progress') // Include cli-progress to show progress in command line
const process = require('process') // Include process to access command line arguments

// Function to compute CSV string from an HTML table
async function computeCsvStringFromTable (
  page,
  tableSelector,
  shouldIncludeRowHeaders
) {
  // Evaluates script within the page context
  const csvString = await page.evaluate(
    (tableSelector, shouldIncludeRowHeaders) => {
      const table = document.querySelector(tableSelector) // Selects the table using the provided selector
      if (!table) {
        return null // Returns null if table is not found
      }

      let csvString = '' // Initializes CSV string
      // Loops through all rows of the table
      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i] // Gets the current row

        // Skips the first row if row headers should not be included
        if (!shouldIncludeRowHeaders && i === 0) {
          continue
        }

        // Loops through all cells in the current row
        for (let j = 0; j < row.cells.length; j++) {
          const cell = row.cells[j] // Gets the current cell

          // Formats the cell text and replaces new lines with '\\n'
          const formattedCellText = cell.innerText.replace(/\n/g, '\\n').trim()
          if (formattedCellText !== 'No Data') {
            // Ignores cells with "No Data"
            csvString += formattedCellText // Appends the cell text to the CSV string
          }

          // Adds a newline at the end of each row, or a comma if not the last cell
          csvString += j === row.cells.length - 1 ? '\n' : ','
        }
      }
      return csvString // Returns the generated CSV string
    },
    tableSelector,
    shouldIncludeRowHeaders
  )

  return csvString // Returns the CSV string
}

;(async () => {
  const browser = await puppeteer.launch() // Launches puppeteer browser
  const page = await browser.newPage() // Opens a new page in the browser
  await page.setViewport({ width: 1920, height: 1080 }) // Sets the viewport size
  await page.goto('https://www.mta.maryland.gov/performance-improvement') // Navigates to the specified URL

  await page.click('h3#ui-id-5') // Clicks on the specified element

  let csvString = '' // Initializes CSV string

  // Selects and stores route options
  const routeSelectSelector = 'select[name="ridership-select-route"]'
  const routeSelectOptions = await page.$eval(routeSelectSelector, select => {
    return Array.from(select.options).map(option => option.value)
  })
  console.log('routes available:', routeSelectOptions)
  // Selects and stores month options
  const monthSelectSelector = 'select[name="ridership-select-month"]'
  const monthSelectOptions = await page.$eval(monthSelectSelector, select => {
    return Array.from(select.options).map(option => option.value)
  })
  console.log('months available:', monthSelectOptions)

  // Selects and stores year options
  const yearSelectSelector = 'select[name="ridership-select-year"]'
  const yearSelectOptions = await page.$eval(yearSelectSelector, select => {
    return Array.from(select.options).map(option => option.value)
  })

  console.log('years available:', yearSelectOptions)

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  ) // Initializes the progress bar
  progressBar.start(monthSelectOptions.length * yearSelectOptions.length, 0) // Starts the progress bar

  let hasIncludedRowHeaders = true // Flag to include row headers once
  // Iterates over each year and month option
  for (const yearSelectOption of yearSelectOptions) {
    await page.focus(yearSelectSelector) // Focuses on the year select
    await page.select(yearSelectSelector, yearSelectOption) // Selects the current year

    for (const monthSelectOption of monthSelectOptions) {
      await page.focus(monthSelectSelector) // Focuses on the month select
      await page.select(monthSelectSelector, monthSelectOption) // Selects the current month

      await page.keyboard.press('Tab') // Presses the Tab key
      await page.keyboard.press('Tab') // Presses the Tab key

      // Waits for the table to load after selecting options
      await Promise.all([
        page.keyboard.press('Enter'), // Presses the Enter key
        page.waitForNetworkIdle() // Waits for network to be idle
      ])

      // Appends the table data as CSV to the csvString
      csvString += await computeCsvStringFromTable(
        page,
        'div#container-ridership-table > table',
        hasIncludedRowHeaders
      )

      // Sets the flag to false after including headers once
      if (hasIncludedRowHeaders) {
        hasIncludedRowHeaders = false
      }

      progressBar.increment() // Increments the progress bar
    }
  }

  progressBar.stop() // Stops the progress bar

  await browser.close() // Closes the browser

  // Writes the CSV string to a file, filename is taken from the first command line argument
  await writeFile(process.argv[2], csvString)
})()

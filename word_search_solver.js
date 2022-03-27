// Puppeteer
const puppeteer = require("puppeteer");

const GRID = [];
const ROWS = 15;
const COLS = 15;
let words;

for (var i = 0; i < ROWS; i++) {
  GRID[i] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
}

const solveWordSearch = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    defaultViewport: null,
    // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage();
  await page.goto("https://wordsearch.samsonn.com/", { waitUntil: "networkidle2" });
  // Wait for selector, and print the matches
  await page.setViewport({ width: 1440, height: 1080 });
  await page.waitForSelector(
    "#App > div.routes > div > div > div.Grid_grid__24j1p > div.Grid_gridCell__1L1O2"
  );
  let root = await page.$("#root");
  await root.evaluate((el) => (el.style.boxSizing = "content-box"));
  let appRoot = await page.$("#App");
  await appRoot.evaluate((el) => (el.style.boxSizing = "content-box"));

  const wordSearchCells = await page.$$eval(
    "#App > div.routes > div > div > div.Grid_grid__24j1p > div.Grid_gridCell__1L1O2",
    (cells) =>
      cells.map((cell) => ({
        row: parseInt(cell.getAttribute("row")),
        col: parseInt(cell.getAttribute("col")),
        x: cell.getBoundingClientRect().x + cell.getBoundingClientRect().width / 2,
        y: cell.getBoundingClientRect().y + cell.getBoundingClientRect().height / 2,
        letter: cell.innerText,
      }))
  );
  // Add the cells to the grid.
  wordSearchCells.forEach((cell) => {
    GRID[parseInt(cell.row)][parseInt(cell.col)] = cell.letter;
  });

  // Get the words
  words = await page.$$eval(".WordList_wordList__3da04 > a", (element) => {
    // Remove the last two characters of each word.
    return element.map((word) => word.getAttribute("id"));
  });

  const solve = async () => {
    // For each word
    for (let h = 0; h < words.length; h++) {
      const STACK = [];
      for (var i = 0; i < ROWS; i++) {
        for (var j = 0; j < COLS; j++) {
          if (GRID[i][j] === words[h][0]) {
            // All 8 directions, can't change directions in the middle.
            const end =
              dfs(i, j, words[h], 0, STACK, "L", "L") ||
              dfs(i, j, words[h], 0, STACK, "R", "R") ||
              dfs(i, j, words[h], 0, STACK, "D", "D") ||
              dfs(i, j, words[h], 0, STACK, "U", "U") ||
              dfs(i, j, words[h], 0, STACK, "BR", "BR") ||
              dfs(i, j, words[h], 0, STACK, "TL", "TL") ||
              dfs(i, j, words[h], 0, STACK, "TR", "TR") ||
              dfs(i, j, words[h], 0, STACK, "BL", "BL");

            // Drag the mouse
            if (end) {
              // Search wordSearch cells for having row as i and column as j.
              const startCell = wordSearchCells.find((cell) => cell.row === i && cell.col === j);
              const endCell = wordSearchCells.find(
                (cell) => cell.row === end.i && cell.col === end.j
              );

              await page.mouse.move(startCell.x, startCell.y);
              await page.mouse.down();
              await page.mouse.move(endCell.x, endCell.y);
              await page.mouse.up();
              await page.waitFor(600);
            }
          }
        }
      }
    }
  };

  await solve();
};

const dfs = (i, j, word, count, STACK, currDir, neededDir) => {
  const rowInBounds = i >= 0 && i < ROWS;
  const colInBounds = j >= 0 && j < COLS;

  if (count === word.length) {
    return STACK[STACK.length - 1];
  }

  if (!rowInBounds || !colInBounds) return false;

  if (GRID[i][j] !== word[count]) return false;

  if (currDir !== neededDir) return false;

  STACK.push({ i: i, j: j });
  const temp = GRID[i][j];
  GRID[i][j] = "";

  let res =
    dfs(i, j - 1, word, count + 1, STACK, "L", neededDir) ||
    dfs(i, j + 1, word, count + 1, STACK, "R", neededDir) ||
    dfs(i + 1, j, word, count + 1, STACK, "D", neededDir) ||
    dfs(i - 1, j, word, count + 1, STACK, "U", neededDir) ||
    dfs(i + 1, j + 1, word, count + 1, STACK, "BR", neededDir) ||
    dfs(i - 1, j - 1, word, count + 1, STACK, "TL", neededDir) ||
    dfs(i - 1, j + 1, word, count + 1, STACK, "TR", neededDir) ||
    dfs(i + 1, j - 1, word, count + 1, STACK, "BL", neededDir);

  GRID[i][j] = temp;
  return res;
};

solveWordSearch();

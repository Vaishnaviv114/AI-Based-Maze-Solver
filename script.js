
// ==========================================
// AI-BASED MAZE SOLVER
// BFS | DFS | A* | Greedy Best-First Search
// ==========================================

// 1. MAZE CONFIGURATION

const ROWS = 20;
const COLS = 20;

const START = { row: 0, col: 0 };
const END = { row: ROWS - 1, col: COLS - 1 };

let walls = new Set();
let isRunning = false;
let isDrawing = false;
let drawingMode = "wall";
let runId = 0;

let comparisonResults = [];

// 2. HTML ELEMENTS

const mazeElement = document.getElementById("maze");
const algorithmSelect = document.getElementById("algorithm");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const clearBtn = document.getElementById("clearBtn");
const randomBtn = document.getElementById("randomBtn");

const speedInput = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");

const statusElement = document.getElementById("status");

const algorithmName = document.getElementById("algorithmName");
const algorithmDescription =
    document.getElementById("algorithmDescription");

const statAlgorithm = document.getElementById("statAlgorithm");
const visitedNodes = document.getElementById("visitedNodes");
const pathLength = document.getElementById("pathLength");
const executionTime = document.getElementById("executionTime");
const pathFound = document.getElementById("pathFound");

const comparisonBody = document.getElementById("comparisonBody");

// 3. ALGORITHM DESCRIPTIONS

const descriptions = {
    bfs: {
        name: "Breadth-First Search",
        description:
            "BFS explores the maze level by level using a queue. " +
            "It guarantees the shortest path in an unweighted grid."
    },

    dfs: {
        name: "Depth-First Search",
        description:
            "DFS explores one direction deeply using a stack. " +
            "It backtracks when it reaches a dead end. " +
            "It does not guarantee the shortest path."
    },

    astar: {
        name: "A* Search",
        description:
            "A* uses actual path cost and estimated remaining distance. " +
            "Its evaluation function is f(n) = g(n) + h(n)."
    },

    greedy: {
        name: "Greedy Best-First Search",
        description:
            "Greedy Search selects the cell that appears closest " +
            "to the destination using Manhattan Distance."
    }
};

// ==========================================
// 4. BASIC HELPER FUNCTIONS
// ==========================================

// Convert row and column into a unique ID

function getId(row, col) {
    return row * COLS + col;
}

// Convert ID into row and column

function getCoordinates(id) {
    return {
        row: Math.floor(id / COLS),
        col: id % COLS
    };
}

// Check grid boundaries

function isValid(row, col) {
    return (
        row >= 0 &&
        row < ROWS &&
        col >= 0 &&
        col < COLS
    );
}

// Check starting point

function isStart(row, col) {
    return row === START.row && col === START.col;
}

// Check destination

function isEnd(row, col) {
    return row === END.row && col === END.col;
}

// Check walls

function isWall(row, col) {
    return walls.has(getId(row, col));
}

// ==========================================
// 5. GRID CREATION
// ==========================================

function createGrid() {

    mazeElement.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            const cell = document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.id = getId(row, col);

            if (isStart(row, col)) {
                cell.classList.add("start");
                cell.title = "Start";
            }

            else if (isEnd(row, col)) {
                cell.classList.add("end");
                cell.title = "Destination";
            }

            else if (isWall(row, col)) {
                cell.classList.add("wall");
            }

            mazeElement.appendChild(cell);
        }
    }
}

// Get cell using ID

function getCell(id) {
    return mazeElement.children[id];
}

// ==========================================
// 6. DRAW AND ERASE WALLS
// ==========================================

function editWall(row, col, mode) {

    // Prevent walls on start and destination

    if (
        !isValid(row, col) ||
        isStart(row, col) ||
        isEnd(row, col)
    ) {
        return;
    }

    const id = getId(row, col);
    const cell = getCell(id);

    if (mode === "wall") {

        walls.add(id);
        cell.className = "cell wall";

    } else {

        walls.delete(id);
        cell.className = "cell";
    }
}

// Draw walls by clicking

mazeElement.addEventListener("pointerdown", (event) => {

    const cell = event.target.closest(".cell");

    if (!cell || isRunning) return;

    event.preventDefault();

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (isStart(row, col) || isEnd(row, col)) return;

    isDrawing = true;

    drawingMode = isWall(row, col)
        ? "erase"
        : "wall";

    editWall(row, col, drawingMode);
});

// Draw walls by dragging

mazeElement.addEventListener("pointerover", (event) => {

    if (!isDrawing || isRunning) return;

    const cell = event.target.closest(".cell");

    if (!cell || !mazeElement.contains(cell)) return;

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    editWall(row, col, drawingMode);
});

// Stop drawing when pointer is released

window.addEventListener("pointerup", () => {
    isDrawing = false;
});

window.addEventListener("pointercancel", () => {
    isDrawing = false;
});

// ==========================================
// 7. FIND NEIGHBOURING CELLS
// ==========================================

function getNeighbors(id) {

    const { row, col } = getCoordinates(id);

    const directions = [
        [-1, 0],  // Up
        [1, 0],   // Down
        [0, -1],  // Left
        [0, 1]    // Right
    ];

    const neighbors = [];

    for (const [dr, dc] of directions) {

        const newRow = row + dr;
        const newCol = col + dc;

        if (
            isValid(newRow, newCol) &&
            !isWall(newRow, newCol)
        ) {
            neighbors.push(getId(newRow, newCol));
        }
    }

    return neighbors;
}

// ==========================================
// 8. MANHATTAN DISTANCE
// ==========================================

function heuristic(id) {

    const { row, col } = getCoordinates(id);

    return (
        Math.abs(row - END.row) +
        Math.abs(col - END.col)
    );
}

// ==========================================
// 9. RECONSTRUCT FINAL PATH
// ==========================================

function reconstructPath(parent) {

    const startId = getId(START.row, START.col);
    const endId = getId(END.row, END.col);

    if (!parent.has(endId)) {
        return [];
    }

    const path = [];

    let current = endId;

    while (current !== startId) {

        path.push(current);

        current = parent.get(current);

        if (current === undefined) {
            return [];
        }
    }

    path.push(startId);

    return path.reverse();
}

// ==========================================
// 10. BREADTH-FIRST SEARCH (BFS)
// Uses Queue
// ==========================================

function bfs() {

    const start = getId(START.row, START.col);
    const end = getId(END.row, END.col);

    const queue = [start];
    let head = 0;

    const visited = [];
    const discovered = new Set([start]);
    const parent = new Map();

    while (head < queue.length) {

        const current = queue[head++];

        visited.push(current);

        if (current === end) {
            break;
        }

        for (const neighbor of getNeighbors(current)) {

            if (!discovered.has(neighbor)) {

                discovered.add(neighbor);

                parent.set(neighbor, current);

                queue.push(neighbor);
            }
        }
    }

    const found = discovered.has(end);

    const path = found
        ? reconstructPath(parent)
        : [];

    return {
        visited,
        path,
        found
    };
}

// ==========================================
// 11. DEPTH-FIRST SEARCH (DFS)
// Uses Stack
// ==========================================

function dfs() {

    const start = getId(START.row, START.col);
    const end = getId(END.row, END.col);

    const stack = [start];

    const visited = [];
    const discovered = new Set([start]);
    const parent = new Map();

    while (stack.length > 0) {

        const current = stack.pop();

        visited.push(current);

        if (current === end) {
            break;
        }

        const neighbors = getNeighbors(current);

        for (const neighbor of neighbors) {

            if (!discovered.has(neighbor)) {

                discovered.add(neighbor);

                parent.set(neighbor, current);

                stack.push(neighbor);
            }
        }
    }

    const found = discovered.has(end);

    const path = found
        ? reconstructPath(parent)
        : [];

    return {
        visited,
        path,
        found
    };
}

// ==========================================
// 12. A* SEARCH
// f(n) = g(n) + h(n)
// ==========================================

function astar() {

    const start = getId(START.row, START.col);
    const end = getId(END.row, END.col);

    const openList = [start];

    const visited = [];
    const closedSet = new Set();

    const parent = new Map();

    const gScore = new Map();

    gScore.set(start, 0);

    while (openList.length > 0) {

        // Select node with lowest f(n)

        openList.sort((a, b) => {

            const fA = gScore.get(a) + heuristic(a);
            const fB = gScore.get(b) + heuristic(b);

            return fA - fB ||
                heuristic(a) - heuristic(b);
        });

        const current = openList.shift();

        if (closedSet.has(current)) {
            continue;
        }

        closedSet.add(current);

        visited.push(current);

        if (current === end) {
            break;
        }

        for (const neighbor of getNeighbors(current)) {

            if (closedSet.has(neighbor)) {
                continue;
            }

            // Movement cost is 1

            const tentativeG =
                gScore.get(current) + 1;

            const oldG = gScore.has(neighbor)
                ? gScore.get(neighbor)
                : Infinity;

            if (tentativeG < oldG) {

                parent.set(neighbor, current);

                gScore.set(neighbor, tentativeG);

                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                }
            }
        }
    }

    const found = closedSet.has(end);

    const path = found
        ? reconstructPath(parent)
        : [];

    return {
        visited,
        path,
        found
    };
}

// ==========================================
// 13. GREEDY BEST-FIRST SEARCH
// f(n) = h(n)
// ==========================================

function greedy() {

    const start = getId(START.row, START.col);
    const end = getId(END.row, END.col);

    const openList = [start];

    const discovered = new Set([start]);

    const visited = [];

    const parent = new Map();

    while (openList.length > 0) {

        // Select cell closest to destination

        openList.sort(
            (a, b) => heuristic(a) - heuristic(b)
        );

        const current = openList.shift();

        visited.push(current);

        if (current === end) {
            break;
        }

        for (const neighbor of getNeighbors(current)) {

            if (!discovered.has(neighbor)) {

                discovered.add(neighbor);

                parent.set(neighbor, current);

                openList.push(neighbor);
            }
        }
    }

    const found = discovered.has(end);

    const path = found
        ? reconstructPath(parent)
        : [];

    return {
        visited,
        path,
        found
    };
}

// ==========================================
// 14. SELECT ALGORITHM
// ==========================================

function runAlgorithm(type) {

    switch (type) {

        case "bfs":
            return bfs();

        case "dfs":
            return dfs();

        case "astar":
            return astar();

        case "greedy":
            return greedy();

        default:
            throw new Error("Invalid algorithm selected.");
    }
}

// ==========================================
// 15. CLEAR SEARCH VISUALIZATION
// ==========================================

function clearVisualization() {

    for (let id = 0; id < ROWS * COLS; id++) {

        const cell = getCell(id);

        const { row, col } = getCoordinates(id);

        cell.className = "cell";

        if (isWall(row, col)) {
            cell.classList.add("wall");
        }

        if (isStart(row, col)) {
            cell.className = "cell start";
        }

        if (isEnd(row, col)) {
            cell.className = "cell end";
        }
    }
}

// ==========================================
// 16. ANIMATION DELAY
// ==========================================

function sleep(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// ==========================================
// 17. ANIMATE SEARCH
// ==========================================

async function animateSearch(result, currentRun) {

    const speed = () => Number(speedInput.value);

    // Animate explored cells

    for (const id of result.visited) {

        if (currentRun !== runId) {
            return false;
        }

        const { row, col } = getCoordinates(id);

        if (!isStart(row, col) && !isEnd(row, col)) {

            getCell(id).classList.add("visited");
        }

        await sleep(speed());
    }

    if (currentRun !== runId) {
        return false;
    }

    // Animate final path

    if (result.found) {

        for (const id of result.path) {

            if (currentRun !== runId) {
                return false;
            }

            const { row, col } = getCoordinates(id);

            if (!isStart(row, col) && !isEnd(row, col)) {

                getCell(id).classList.remove("visited");

                getCell(id).classList.add("path");
            }

            await sleep(speed());
        }
    }

    return currentRun === runId;
}

// ==========================================
// 18. DISPLAY PERFORMANCE STATISTICS
// ==========================================

function displayStatistics(type, result, time) {

    statAlgorithm.textContent = descriptions[type].name;

    visitedNodes.textContent = result.visited.length;

    // Number of movements, excluding starting cell

    pathLength.textContent = result.found
        ? result.path.length - 1
        : 0;

    executionTime.textContent =
        time.toFixed(3) + " ms";

    pathFound.textContent =
        result.found ? "Yes" : "No";

    pathFound.style.color = result.found
        ? "#22c55e"
        : "#ef4444";
}

// ==========================================
// 19. ALGORITHM COMPARISON
// ==========================================

function updateComparison(type, result, time) {

    const name = descriptions[type].name;

    const existingIndex = comparisonResults.findIndex(
        item => item.type === type
    );

    const data = {

        type,
        name,

        visited: result.visited.length,

        path: result.found
            ? result.path.length - 1
            : 0,

        time: time.toFixed(3),

        found: result.found
    };

    if (existingIndex !== -1) {

        comparisonResults[existingIndex] = data;

    } else {

        comparisonResults.push(data);
    }

    comparisonBody.innerHTML = "";

    comparisonResults.forEach(item => {

        const row = document.createElement("tr");

        const values = [
            item.name,
            item.visited,
            item.found ? item.path : "No path"
        ];

        values.forEach(value => {

            const td = document.createElement("td");

            td.textContent = value;

            row.appendChild(td);
        });

        comparisonBody.appendChild(row);
    });
}

// ==========================================
// 20. START SEARCH
// ==========================================

async function startSearch() {

    if (isRunning) return;

    isRunning = true;

    const type = algorithmSelect.value;

    const currentRun = ++runId;

    const algorithm = descriptions[type];

    statusElement.textContent = "Searching...";

    algorithmName.textContent = algorithm.name;

    algorithmDescription.textContent =
        algorithm.description;

    clearVisualization();

    setControls(true);

    try {

        // Calculate actual algorithm execution time

        const startTime = performance.now();

        const result = runAlgorithm(type);

        const endTime = performance.now();

        const elapsedTime = endTime - startTime;

        // Animate the algorithm result

        const completed = await animateSearch(
            result,
            currentRun
        );

        if (!completed) return;

        // Display statistics

        displayStatistics(
            type,
            result,
            elapsedTime
        );

        // Update comparison table

        updateComparison(
            type,
            result,
            elapsedTime
        );

        if (result.found) {

            statusElement.textContent = "Path Found!";

        } else {

            statusElement.textContent = "No Path Exists!";
        }

    } catch (error) {

        console.error("Search error:", error);

        statusElement.textContent = "Search Error";

        alert("An error occurred during search.");

    } finally {

        if (currentRun === runId) {

            isRunning = false;

            setControls(false);
        }
    }
}

// ==========================================
// 21. CONTROL BUTTON STATES
// ==========================================

function setControls(running) {

    startBtn.disabled = running;

    clearBtn.disabled = running;

    randomBtn.disabled = running;

    algorithmSelect.disabled = running;

    // Reset can always cancel an active search

    resetBtn.disabled = false;
}

// ==========================================
// 22. RESET SEARCH
// Preserves existing walls
// ==========================================

function resetSearch() {

    // Cancel current animation

    runId++;

    isRunning = false;

    isDrawing = false;

    setControls(false);

    clearVisualization();

    statusElement.textContent = "Ready to Start";

    statAlgorithm.textContent = "-";

    visitedNodes.textContent = "0";

    pathLength.textContent = "0";

    executionTime.textContent = "0 ms";

    pathFound.textContent = "-";

    pathFound.style.color = "";

    // Clear comparison data

    comparisonResults = [];

    comparisonBody.innerHTML =
        '<tr><td colspan="3">No results yet</td></tr>';
}

// ==========================================
// 23. CLEAR MAZE
// Removes all obstacles
// ==========================================

function clearMaze() {

    if (isRunning) return;

    walls.clear();

    resetSearch();

    createGrid();
}

// ==========================================
// 24. RANDOM MAZE GENERATION
// IMPORTANT: ONLY GENERATES SOLVABLE MAZES
// ==========================================

function generateRandomMaze() {

    if (isRunning) return;

    let attempts = 0;

    let pathExists = false;

    // Try up to 100 times to create a solvable maze

    while (!pathExists && attempts < 100) {

        walls.clear();

        for (let row = 0; row < ROWS; row++) {

            for (let col = 0; col < COLS; col++) {

                // Never block start or destination

                if (isStart(row, col) || isEnd(row, col)) {
                    continue;
                }

                // 25% probability of creating a wall

                if (Math.random() < 0.25) {

                    walls.add(getId(row, col));
                }
            }
        }

        // Use BFS to verify the maze

        const result = bfs();

        pathExists = result.found;

        attempts++;
    }

    // Fallback: an empty maze always has a path

    if (!pathExists) {

        walls.clear();
    }

    resetSearch();

    createGrid();

    statusElement.textContent = pathExists
        ? "Solvable Maze Generated!"
        : "Empty Maze Generated!";
}

// ==========================================
// 25. ALGORITHM DESCRIPTION UPDATE
// ==========================================

algorithmSelect.addEventListener("change", () => {

    const type = algorithmSelect.value;

    const info = descriptions[type];

    algorithmName.textContent = info.name;

    algorithmDescription.textContent =
        info.description;
});

// ==========================================
// 26. SPEED CONTROL
// ==========================================

speedInput.addEventListener("input", () => {

    speedValue.textContent = speedInput.value;
});

// ==========================================
// 27. BUTTON EVENT LISTENERS
// ==========================================

startBtn.addEventListener("click", startSearch);

resetBtn.addEventListener("click", resetSearch);

clearBtn.addEventListener("click", clearMaze);

randomBtn.addEventListener("click", generateRandomMaze);

// ==========================================
// 28. INITIALIZE APPLICATION
// ==========================================

createGrid();

console.log(
    "AI-Based Maze Solver initialized successfully!"
);

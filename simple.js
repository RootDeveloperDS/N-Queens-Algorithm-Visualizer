const DEFAULT_QUEEN_SETTLE_MS = 220;
const DEFAULT_QUEEN_SHIFT_MS = 240;
const DEFAULT_QUEEN_SHIFT_TIMEOUT_BUFFER_MS = 40;

class NQueensVisualizer {
        constructor() {
                this.boardSize = 5;
                this.speed = 1000;
                this.queenSettleDuration = DEFAULT_QUEEN_SETTLE_MS;
                this.queenShiftDuration = DEFAULT_QUEEN_SHIFT_MS;
                this.queenShiftTimeoutBuffer = DEFAULT_QUEEN_SHIFT_TIMEOUT_BUFFER_MS;
                this.board = [];
                this.lastPlacedCols = [];
                this.solutions = [];
                this.attemptCount = 0;
                this.currentRow = 0;
                this.isRunning = false;
                this.isPaused = false;

                this.initializeElements();
                this.syncAnimationDurationsFromCss();
                this.setupEventListeners();
                this.createBoard();
        }

        syncAnimationDurationsFromCss() {
                const rootStyles = getComputedStyle(document.documentElement);
                this.queenSettleDuration = this.parseDurationToMs(
                        rootStyles.getPropertyValue('--queen-settle-duration'),
                        this.queenSettleDuration
                );
                this.queenShiftDuration = this.parseDurationToMs(
                        rootStyles.getPropertyValue('--queen-shift-duration'),
                        this.queenShiftDuration
                );
        }

        parseDurationToMs(duration, fallback) {
                const value = (duration || '').trim();
                if (!value) return fallback;

                if (value.endsWith('ms')) {
                        const parsed = parseFloat(value);
                        return Number.isFinite(parsed) ? parsed : fallback;
                }

                if (value.endsWith('s')) {
                        const parsed = parseFloat(value);
                        return Number.isFinite(parsed) ? parsed * 1000 : fallback;
                }

                return fallback;
        }

        initializeElements() {
                this.boardElement = document.getElementById('board');
                this.boardSizeSelect = document.getElementById('boardSize');
                this.speedSelect = document.getElementById('speed');
                this.startBtn = document.getElementById('startBtn');
                this.pauseBtn = document.getElementById('pauseBtn');
                this.resetBtn = document.getElementById('resetBtn');
                this.solutionCountElement = document.getElementById('solutionCount');
                this.attemptCountElement = document.getElementById('attemptCount');
                this.statusElement = document.getElementById('status');
                this.solutionListElement = document.getElementById('solutionList');
        }

        setupEventListeners() {
                this.boardSizeSelect.addEventListener('change', () => {
                        this.boardSize = parseInt(this.boardSizeSelect.value);
                        this.createBoard();
                        this.reset();
                });

                this.speedSelect.addEventListener('change', () => {
                        this.speed = parseInt(this.speedSelect.value);
                });

                this.startBtn.addEventListener('click', () => this.start());
                this.pauseBtn.addEventListener('click', () => this.pause());
                this.resetBtn.addEventListener('click', () => this.reset());
        }

        createBoard() {
                this.boardElement.innerHTML = '';
                this.boardElement.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;

                for (let row = 0; row < this.boardSize; row++) {
                        for (let col = 0; col < this.boardSize; col++) {
                                const cell = document.createElement('div');
                                cell.className = 'cell';
                                cell.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                                cell.dataset.row = row;
                                cell.dataset.col = col;
                                this.boardElement.appendChild(cell);
                        }
                }
        }

        reset() {
                this.stop();
                this.board = new Array(this.boardSize).fill(-1);
                this.lastPlacedCols = new Array(this.boardSize).fill(-1);
                this.solutions = [];
                this.attemptCount = 0;
                this.currentRow = 0;
                this.updateStats();
                this.clearBoard();
                this.solutionListElement.innerHTML = '';
                this.statusElement.textContent = 'Ready';
        }

        clearBoard() {
                const cells = this.boardElement.querySelectorAll('.cell');
                cells.forEach(cell => {
                        cell.textContent = '';
                        cell.classList.remove('queen', 'queen--placed', 'queen--active', 'current', 'safe', 'unsafe');
                });
        }

        async start() {
                if (this.isRunning) return;

                this.reset();
                this.isRunning = true;
                this.isPaused = false;
                this.startBtn.disabled = true;
                this.pauseBtn.disabled = false;
                this.pauseBtn.textContent = 'Pause';
                this.statusElement.textContent = 'Running...';

                await this.solveNQueens();

                const wasStopped = !this.isRunning;
                this.isRunning = false;
                this.startBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.pauseBtn.textContent = 'Pause';
                this.statusElement.textContent = wasStopped ? 'Ready' : 'Complete';
        }

        pause() {
                if (!this.isRunning) return;

                this.isPaused = !this.isPaused;
                this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
                this.statusElement.textContent = this.isPaused ? 'Paused' : 'Running...';
        }

        stop() {
                this.isRunning = false;
                this.isPaused = false;
                this.startBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.pauseBtn.textContent = 'Pause';
        }

        async solveNQueens() {
                await this.solve(0);
        }

        async solve(row) {
                if (!this.isRunning) return false;

                if (row === this.boardSize) {
                        this.foundSolution();
                        return false;
                }

                this.currentRow = row;
                this.highlightCurrentRow(row);

                for (let col = 0; col < this.boardSize; col++) {
                        if (!this.isRunning) return false;

                        this.attemptCount++;
                        this.updateStats();

                        if (this.isSafe(row, col)) {
                                const previousCol = this.lastPlacedCols[row];
                                this.board[row] = col;
                                await this.placeQueen(row, col, previousCol);
                                this.lastPlacedCols[row] = col;
                                this.highlightPosition(row, col, 'safe');

                                await this.delay(this.speed);

                                await this.solve(row + 1);
                                if (!this.isRunning) return false;

                                this.board[row] = -1;
                                await this.removeQueen(row, col);
                        } else {
                                this.highlightPosition(row, col, 'unsafe');
                                await this.delay(this.speed / 2);
                                this.clearHighlight(row, col);
                        }
                }

                return false;
        }

        isSafe(row, col) {
                for (let i = 0; i < row; i++) {
                        if (this.board[i] === col ||
                                Math.abs(this.board[i] - col) === Math.abs(i - row)) {
                                return false;
                        }
                }
                return true;
        }

        async placeQueen(row, col, fromCol = -1) {
                if (fromCol !== -1 && fromCol !== col) {
                        await this.animateQueenShift(row, fromCol, col);
                }

                const cell = this.getCell(row, col);
                cell.textContent = '♛';
                cell.classList.add('queen', 'queen--active');
                cell.classList.remove('queen--placed');

                await this.delay(this.queenSettleDuration);
                if (this.board[row] === col) {
                        cell.classList.remove('queen--active');
                        cell.classList.add('queen--placed');
                }
        }

        async removeQueen(row, col) {
                const cell = this.getCell(row, col);
                cell.textContent = '';
                cell.classList.remove('queen', 'queen--placed', 'queen--active', 'safe', 'unsafe');
        }

        highlightCurrentRow(row) {
                this.clearHighlights();
                this.renderPlacedQueens();
                for (let col = 0; col < this.boardSize; col++) {
                        if (this.board[row] === -1) {
                                this.highlightPosition(row, col, 'current');
                        }
                }
        }

        highlightPosition(row, col, className) {
                const cell = this.getCell(row, col);
                cell.classList.add(className);
        }

        clearHighlight(row, col) {
                const cell = this.getCell(row, col);
                cell.classList.remove('current', 'safe', 'unsafe');
        }

        clearHighlights() {
                const cells = this.boardElement.querySelectorAll('.cell');
                cells.forEach(cell => {
                        cell.classList.remove('current', 'safe', 'unsafe');
                });
        }

        renderPlacedQueens() {
                for (let row = 0; row < this.boardSize; row++) {
                        const col = this.board[row];
                        if (col === -1) continue;
                        const cell = this.getCell(row, col);
                        cell.textContent = '♛';
                        cell.classList.add('queen', 'queen--placed');
                        cell.classList.remove('queen--active');
                }
        }

        async animateQueenShift(row, fromCol, toCol) {
                const sourceCell = this.getCell(row, fromCol);
                const targetCell = this.getCell(row, toCol);
                const boardRect = this.boardElement.getBoundingClientRect();
                const sourceRect = sourceCell.getBoundingClientRect();
                const targetRect = targetCell.getBoundingClientRect();

                const movingQueen = document.createElement('div');
                movingQueen.className = 'moving-queen';
                movingQueen.textContent = '♛';
                movingQueen.style.left = `${sourceRect.left - boardRect.left}px`;
                movingQueen.style.top = `${sourceRect.top - boardRect.top}px`;
                movingQueen.style.width = `${sourceRect.width}px`;
                movingQueen.style.height = `${sourceRect.height}px`;
                this.boardElement.appendChild(movingQueen);

                await new Promise(resolve => requestAnimationFrame(resolve));

                movingQueen.style.transform = `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px)`;

                await new Promise(resolve => {
                        const onTransitionEnd = () => {
                                clearTimeout(fallbackId);
                                resolve();
                        };
                        const onFallback = () => {
                                clearTimeout(fallbackId);
                                movingQueen.removeEventListener('transitionend', onTransitionEnd);
                                resolve();
                        };
                        movingQueen.addEventListener('transitionend', onTransitionEnd, { once: true });
                        const fallbackId = setTimeout(
                                onFallback,
                                this.queenShiftDuration + this.queenShiftTimeoutBuffer
                        );
                });

                movingQueen.remove();
        }

        getCell(row, col) {
                return this.boardElement.children[row * this.boardSize + col];
        }

        foundSolution() {
                this.solutions.push([...this.board]);
                this.displaySolution();
                this.updateStats();

                // Add celebration animation
                const boardElement = this.boardElement;
                boardElement.style.animation = 'pulse 1s ease-in-out';
                setTimeout(() => {
                        boardElement.style.animation = '';
                }, 1000);
        }

        displaySolution() {
                const solutionDiv = document.createElement('div');
                solutionDiv.className = 'solution-item';
                solutionDiv.innerHTML = `<strong>Solution ${this.solutions.length}</strong>`;
                solutionDiv.style.animation = 'fadeIn 0.5s ease-out';

                const miniBoard = document.createElement('div');
                miniBoard.className = 'mini-board';
                miniBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;

                for (let row = 0; row < this.boardSize; row++) {
                        for (let col = 0; col < this.boardSize; col++) {
                                const miniCell = document.createElement('div');
                                miniCell.className = 'mini-cell';
                                miniCell.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                                if (this.board[row] === col) {
                                        miniCell.textContent = '♛';
                                        miniCell.style.animation = 'fadeIn 0.3s ease-out';
                                }
                                miniBoard.appendChild(miniCell);
                        }
                }

                solutionDiv.appendChild(miniBoard);
                this.solutionListElement.appendChild(solutionDiv);
        }

        updateStats() {
                this.solutionCountElement.textContent = this.solutions.length;
                this.attemptCountElement.textContent = this.attemptCount;
        }

        delay(ms) {
                return new Promise(resolve => {
                        let elapsed = 0;
                        let lastTime = performance.now();
                        let resolved = false;

                        const finish = () => {
                                if (resolved) return;
                                resolved = true;
                                resolve();
                        };

                        const step = now => {
                                if (resolved) return;
                                if (!this.isRunning) {
                                        finish();
                                        return;
                                }

                                const delta = now - lastTime;
                                lastTime = now;

                                if (!this.isPaused) {
                                        elapsed += delta;
                                        if (elapsed >= ms) {
                                                finish();
                                                return;
                                        }
                                }

                                requestAnimationFrame(step);
                        };

                        requestAnimationFrame(step);
                });
        }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
        new NQueensVisualizer();
});
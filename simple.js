class NQueensVisualizer {
    constructor() {
        this.boardSize = 5;
        this.speed = 1000;
        this.board = [];
        this.solutions = [];
        this.attemptCount = 0;
        this.currentRow = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.timeoutId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.createBoard();
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
            cell.classList.remove('queen', 'current', 'safe', 'unsafe');
        });
    }
    
    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.statusElement.textContent = 'Running...';
        
        await this.solveNQueens();
        
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.statusElement.textContent = 'Complete';
    }
    
    pause() {
        this.isPaused = true;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.statusElement.textContent = 'Paused';
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }
    
    async solveNQueens() {
        await this.solve(0);
    }
    
    async solve(row) {
        if (!this.isRunning || this.isPaused) return false;
        
        if (row === this.boardSize) {
            this.foundSolution();
            return true;
        }
        
        this.currentRow = row;
        this.highlightCurrentRow(row);
        
        for (let col = 0; col < this.boardSize; col++) {
            if (!this.isRunning || this.isPaused) return false;
            
            this.attemptCount++;
            this.updateStats();
            
            if (this.isSafe(row, col)) {
                this.board[row] = col;
                this.placeQueen(row, col);
                this.highlightPosition(row, col, 'safe');
                
                await this.delay(this.speed);
                
                if (await this.solve(row + 1)) {
                    return true;
                }
                
                this.board[row] = -1;
                this.removeQueen(row, col);
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
    
    placeQueen(row, col) {
        const cell = this.getCell(row, col);
        cell.textContent = '♛';
        cell.classList.add('queen');
        
        // Add animation
        cell.style.animation = 'shake 0.3s ease-in-out';
        setTimeout(() => {
            cell.style.animation = '';
        }, 300);
    }
    
    removeQueen(row, col) {
        const cell = this.getCell(row, col);
        cell.textContent = '';
        cell.classList.remove('queen', 'safe', 'unsafe');
    }
    
    highlightCurrentRow(row) {
        this.clearBoard();
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
            this.timeoutId = setTimeout(resolve, ms);
        });
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NQueensVisualizer();
});

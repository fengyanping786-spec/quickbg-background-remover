// 井字棋游戏逻辑 - 完善版

// 游戏状态
const gameState = {
    board: Array(9).fill(''),
    currentPlayer: 'X', // X为玩家，O为AI
    gameActive: true,
    isAiThinking: false,
    scores: {
        playerX: 0,
        playerO: 0,
        draws: 0
    },
    stats: {
        gamesPlayed: 0,
        playerWins: 0,
        aiWins: 0
    },
    difficulty: 'hard', // easy, medium, hard
    winningLine: null
};

// 获胜组合
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 竖
    [0, 4, 8], [2, 4, 6]             // 斜
];

// 初始化
function init() {
    createBoard();
    loadFromLocalStorage();
    updateUI();
    setupEventListeners();
    updateBoardState();
}

// 创建棋盘
function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        board.appendChild(cell);
    }
}

// 处理格子点击
function handleCellClick(index) {
    if (!gameState.gameActive || 
        gameState.board[index] !== '' || 
        gameState.currentPlayer !== 'X' ||
        gameState.isAiThinking) {
        return;
    }
    
    // 玩家下棋
    makeMove(index, 'X');
    
    // 检查游戏是否结束
    if (checkGameEnd()) return;
    
    // AI下棋
    gameState.currentPlayer = 'O';
    updateStatus();
    updateBoardState();
    
    // 显示AI思考中
    document.getElementById('aiThinking').classList.add('active');
    gameState.isAiThinking = true;
    
    // 根据难度设置不同的思考时间
    let thinkTime = 500;
    switch (gameState.difficulty) {
        case 'easy': thinkTime = 300 + Math.random() * 700; break;
        case 'medium': thinkTime = 500 + Math.random() * 1000; break;
        case 'hard': thinkTime = 800 + Math.random() * 1200; break;
    }
    
    // 延迟执行AI移动，增加真实感
    setTimeout(() => {
        aiMove();
        document.getElementById('aiThinking').classList.remove('active');
        gameState.isAiThinking = false;
        checkGameEnd();
        updateBoardState();
    }, thinkTime);
}

// 执行移动
function makeMove(index, player) {
    gameState.board[index] = player;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    cell.classList.add('occupied');
}

// AI移动
function aiMove() {
    if (!gameState.gameActive) return;
    
    let moveIndex;
    
    switch (gameState.difficulty) {
        case 'easy':
            // 简单：随机移动，偶尔会犯错
            moveIndex = getRandomMove();
            break;
        case 'medium':
            // 中等：70%最优，30%随机
            moveIndex = Math.random() < 0.7 ? getBestMove() : getRandomMove();
            break;
        case 'hard':
            // 困难：总是最优移动（不可战胜）
            moveIndex = getBestMove();
            break;
    }
    
    if (moveIndex !== -1) {
        makeMove(moveIndex, 'O');
        gameState.currentPlayer = 'X';
        updateStatus();
    }
}

// 获取随机移动
function getRandomMove() {
    const emptyCells = gameState.board
        .map((cell, index) => cell === '' ? index : -1)
        .filter(index => index !== -1);
    
    return emptyCells.length > 0 ? 
        emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
}

// 获取最佳移动（极小化极大算法）
function getBestMove() {
    // 如果是第一步，优先选择中心或角位
    const emptyCount = gameState.board.filter(cell => cell === '').length;
    if (emptyCount === 9) {
        // 第一步：中心最优，角位次优
        const firstMoves = [4, 0, 2, 6, 8];
        for (const move of firstMoves) {
            if (gameState.board[move] === '') return move;
        }
    }
    
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = 'O';
            let score = minimax(gameState.board, 0, false);
            gameState.board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

// 极小化极大算法
function minimax(board, depth, isMaximizing) {
    // 检查游戏状态
    const result = checkWinner(board);
    
    if (result !== null) {
        if (result === 'O') return 10 - depth;  // AI赢
        if (result === 'X') return depth - 10;  // 玩家赢
        return 0;  // 平局
    }
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// 检查获胜者
function checkWinner(board = gameState.board) {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    
    // 检查是否平局
    if (!board.includes('')) {
        return 'draw';
    }
    
    return null;
}

// 检查游戏是否结束
function checkGameEnd() {
    const winner = checkWinner();
    
    if (winner) {
        gameState.gameActive = false;
        gameState.stats.gamesPlayed++;
        
        if (winner === 'X') {
            gameState.scores.playerX++;
            gameState.stats.playerWins++;
            updateStatus(`🎉 玩家胜利！`);
            highlightWinningCells();
        } else if (winner === 'O') {
            gameState.scores.playerO++;
            gameState.stats.aiWins++;
            updateStatus(`🤖 AI胜利！`);
            highlightWinningCells();
        } else {
            gameState.scores.draws++;
            updateStatus(`🤝 平局！`);
        }
        
        saveToLocalStorage();
        updateUI();
        updateBoardState();
        return true;
    }
    
    return false;
}

// 高亮获胜的格子
function highlightWinningCells() {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState.board[a] && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            
            pattern.forEach(index => {
                const cell = document.querySelector(`.cell[data-index="${index}"]`);
                cell.classList.add('win');
            });
            
            break;
        }
    }
}

// 更新状态显示
function updateStatus(message = null) {
    const status = document.getElementById('status');
    
    if (message) {
        status.textContent = message;
        if (message.includes('胜利')) {
            status.classList.add('win');
        } else if (message.includes('平局')) {
            status.classList.add('draw');
        }
    } else {
        status.classList.remove('win', 'draw');
        const playerName = gameState.currentPlayer === 'X' ? 
            '<span style="color: #00dbde;">玩家 (X)</span>' : 
            '<span style="color: #fc00ff;">AI (O)</span>';
        status.innerHTML = `轮到 ${playerName} 下棋`;
    }
    
    // 更新玩家活动状态
    document.querySelectorAll('.player').forEach(player => {
        player.classList.remove('active');
    });
    
    if (gameState.gameActive) {
        const activePlayer = gameState.currentPlayer === 'X' ? 
            document.querySelector('.player-x') : 
            document.querySelector('.player-o');
        if (activePlayer) activePlayer.classList.add('active');
    }
}

// 更新棋盘状态（启用/禁用格子）
function updateBoardState() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const index = parseInt(cell.dataset.index);
        const isOccupied = gameState.board[index] !== '';
        const isDisabled = !gameState.gameActive || 
                          gameState.currentPlayer !== 'X' || 
                          gameState.isAiThinking ||
                          isOccupied;
        
        if (isDisabled) {
            cell.classList.add('disabled');
        } else {
            cell.classList.remove('disabled');
        }
    });
}

// 更新UI
function updateUI() {
    document.getElementById('playerXScore').textContent = gameState.scores.playerX;
    document.getElementById('playerOScore').textContent = gameState.scores.playerO;
    document.getElementById('gamesPlayed').textContent = gameState.stats.gamesPlayed;
    document.getElementById('playerWins').textContent = gameState.stats.playerWins;
    document.getElementById('aiWins').textContent = gameState.stats.aiWins;
}

// 新游戏
function newGame() {
    gameState.board = Array(9).fill('');
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    gameState.isAiThinking = false;
    gameState.winningLine = null;
    
    // 重置棋盘
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
        cell.classList.remove('x', 'o', 'occupied', 'win', 'disabled');
    });
    
    // 隐藏AI思考提示
    document.getElementById('aiThinking').classList.remove('active');
    
    updateStatus();
    updateUI();
    updateBoardState();
}

// 重置分数
function resetScore() {
    if (confirm('确定要重置所有分数和统计吗？')) {
        gameState.scores = { playerX: 0, playerO: 0, draws: 0 };
        gameState.stats = { gamesPlayed: 0, playerWins: 0, aiWins: 0 };
        saveToLocalStorage();
        updateUI();
        newGame();
    }
}

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('newGameBtn').addEventListener('click', newGame);
    document.getElementById('resetScoreBtn').addEventListener('click', resetScore);
    
    // 难度选择
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (gameState.isAiThinking) return;
            
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameState.difficulty = this.dataset.difficulty;
            
            // 保存难度设置
            saveToLocalStorage();
            
            // 如果游戏正在进行中，询问是否重新开始
            if (gameState.gameActive && gameState.currentPlayer === 'O') {
                if (confirm('切换难度将重新开始当前游戏，确定吗？')) {
                    newGame();
                }
            }
        });
    });
}

// 保存到本地存储
function saveToLocalStorage() {
    localStorage.setItem('ticTacToeState', JSON.stringify({
        scores: gameState.scores,
        stats: gameState.stats,
        difficulty: gameState.difficulty
    }));
}

// 从本地存储加载
function loadFromLocalStorage() {
    const saved = localStorage.getItem('ticTacToeState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.scores = data.scores || gameState.scores;
            gameState.stats = data.stats || gameState.stats;
            gameState.difficulty = data.difficulty || 'hard';
            
            // 设置活动难度按钮
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.difficulty === gameState.difficulty);
            });
        } catch (e) {
            console.error('加载保存数据失败:', e);
        }
    }
}

// 初始化游戏
init();
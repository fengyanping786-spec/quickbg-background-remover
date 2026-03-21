// 井字棋游戏逻辑测试

// 测试棋盘状态
const testBoard = [
    'X', 'O', 'X',
    'O', 'X', 'O',
    'O', 'X', 'O'
];

// 获胜组合
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 竖
    [0, 4, 8], [2, 4, 6]             // 斜
];

// 检查获胜者
function checkWinner(board) {
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

// 测试用例
console.log('=== 井字棋逻辑测试 ===\n');

// 测试1: 空棋盘
const emptyBoard = Array(9).fill('');
console.log('测试1 - 空棋盘:', checkWinner(emptyBoard) === null ? '✓ 通过' : '✗ 失败');

// 测试2: X横线获胜
const xWinRow = ['X', 'X', 'X', '', 'O', 'O', '', '', ''];
console.log('测试2 - X横线获胜:', checkWinner(xWinRow) === 'X' ? '✓ 通过' : '✗ 失败');

// 测试3: O竖线获胜
const oWinCol = ['X', 'O', 'X', 'X', 'O', '', '', 'O', ''];
console.log('测试3 - O竖线获胜:', checkWinner(oWinCol) === 'O' ? '✓ 通过' : '✗ 失败');

// 测试4: X斜线获胜
const xWinDiag = ['X', 'O', 'O', '', 'X', '', '', '', 'X'];
console.log('测试4 - X斜线获胜:', checkWinner(xWinDiag) === 'X' ? '✓ 通过' : '✗ 失败');

// 测试5: 平局
const drawBoard = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
console.log('测试5 - 平局:', checkWinner(drawBoard) === 'draw' ? '✓ 通过' : '✗ 失败');

// 测试6: 游戏未结束
const ongoingBoard = ['X', 'O', 'X', '', '', 'O', '', '', ''];
console.log('测试6 - 游戏进行中:', checkWinner(ongoingBoard) === null ? '✓ 通过' : '✗ 失败');

// 测试极小化极大算法
function minimax(board, depth, isMaximizing) {
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

// 测试AI最佳移动
function getBestMove(board) {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

console.log('\n=== AI算法测试 ===');

// 测试AI在中心下棋（最优开局）
const initialBoard = Array(9).fill('');
console.log('AI开局最佳位置:', getBestMove(initialBoard) === 4 ? '✓ 中心(4)' : '✗ 错误');

// 测试AI阻挡玩家获胜
const blockBoard = ['X', 'X', '', 'O', '', '', '', '', ''];
console.log('AI阻挡玩家获胜:', getBestMove(blockBoard) === 2 ? '✓ 位置2' : '✗ 错误');

// 测试AI选择获胜
const winBoard = ['O', 'O', '', 'X', 'X', '', '', '', ''];
console.log('AI选择获胜位置:', getBestMove(winBoard) === 2 ? '✓ 位置2' : '✗ 错误');

console.log('\n=== 测试完成 ===');
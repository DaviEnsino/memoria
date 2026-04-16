document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const totalMovesSpan = document.getElementById('total-moves');
    const totalMatchesSpan = document.getElementById('total-matches');
    const totalPairsSpan = document.getElementById('total-pairs');
    const resetButton = document.getElementById('reset-button');
    const currentPlayerSpan = document.getElementById('current-player');
    const gridSizeSelect = document.getElementById('grid-size-select');
    
    const gameOverModal = document.getElementById('game-over-modal');
    const resultMessage = document.getElementById('result-message');
    const finalStats = document.getElementById('final-stats');
    const modalResetButton = document.getElementById('modal-reset-button');
    
    const playerScoreDivs = [
        document.getElementById('player-1-score'),
        document.getElementById('player-2-score')
    ];
    const playerScoreSpans = playerScoreDivs.map(div => div.querySelector('.score'));

    const allCardDataPairs = [
        { pow: { id: '2^2', content: '2<sup>2</sup>' }, res: { id: '4', content: '4' } },
        { pow: { id: '3^2', content: '3<sup>2</sup>' }, res: { id: '9', content: '9' } },
        { pow: { id: '2^3', content: '2<sup>3</sup>' }, res: { id: '8', content: '8' } },
        { pow: { id: '4^2', content: '4<sup>2</sup>' }, res: { id: '16', content: '16' } },
        { pow: { id: '5^2', content: '5<sup>2</sup>' }, res: { id: '25', content: '25' } },
        { pow: { id: '3^3', content: '3<sup>3</sup>' }, res: { id: '27', content: '27' } },
        { pow: { id: '6^2', content: '6<sup>2</sup>' }, res: { id: '36', content: '36' } },
        { pow: { id: '2^5', content: '2<sup>5</sup>' }, res: { id: '32', content: '32' } },
        { pow: { id: '7^2', content: '7<sup>2</sup>' }, res: { id: '49', content: '49' } },
        { pow: { id: '4^3', content: '4<sup>3</sup>' }, res: { id: '64', content: '64' } }
    ];

    let cards = [];
    let flippedCards = [];
    let lockBoard = false;
    let totalMoves = 0;
    let totalMatchesFound = 0;
    let totalPairs = 0;
    let currentPlayer = 1;
    let playerScores = [0, 0];

    function initializeGame() {
        gameOverModal.style.display = 'none';
        const gridSize = gridSizeSelect.value;
        let pairsToUse = 0;
        let gridCols = 0;
        let gridRows = 0;

        switch (gridSize) {
            case '4x4': pairsToUse = 8; gridCols = 4; gridRows = 4; break;
            case '5x4': pairsToUse = 10; gridCols = 5; gridRows = 4; break;
            case '4x3':
            default: pairsToUse = 6; gridCols = 4; gridRows = 3;
        }
        
        totalPairs = pairsToUse;
        gameBoard.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${gridRows}, 1fr)`;

        totalMoves = 0;
        totalMatchesFound = 0;
        flippedCards = [];
        lockBoard = false;
        currentPlayer = 1;
        playerScores = [0, 0];

        totalMovesSpan.textContent = '0';
        totalMatchesSpan.textContent = '0';
        totalPairsSpan.textContent = totalPairs;
        gameBoard.innerHTML = '';
        currentPlayerSpan.textContent = '1';
        
        playerScoreSpans.forEach(span => span.textContent = '0');
        updateActivePlayerHighlight();

        let selectedPairs = shuffle([...allCardDataPairs]).slice(0, pairsToUse);
        let gameCards = [];
        selectedPairs.forEach(pair => {
            gameCards.push({ id: pair.pow.id, content: pair.pow.content, matchId: pair.res.id });
            gameCards.push({ id: pair.res.id, content: pair.res.content, matchId: pair.pow.id });
        });

        cards = shuffle(gameCards);
        createBoard();
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function createBoard() {
        cards.forEach(cardData => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.dataset.id = cardData.id;
            cardElement.dataset.matchId = cardData.matchId;
            const cardContent = document.createElement('div');
            cardContent.classList.add('card-content');
            cardContent.innerHTML = cardData.content;
            cardElement.appendChild(cardContent);
            cardElement.addEventListener('click', flipCard);
            gameBoard.appendChild(cardElement);
        });
    }

    function flipCard(event) {
        const clickedCard = event.currentTarget;
        if (lockBoard || clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) return;
        clickedCard.classList.add('flipped');
        flippedCards.push(clickedCard);
        if (flippedCards.length === 2) {
            lockBoard = true;
            incrementTotalMoves();
            checkForMatch();
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        const isMatch = (card1.dataset.id === card2.dataset.matchId) && (card2.dataset.id === card1.dataset.matchId);
        if (isMatch) handleMatch(); else handleMismatch();
    }

    function handleMatch() {
        flippedCards.forEach(card => card.classList.add('matched'));
        playerScores[currentPlayer - 1]++;
        playerScoreSpans[currentPlayer - 1].textContent = playerScores[currentPlayer - 1];
        totalMatchesFound++;
        totalMatchesSpan.textContent = totalMatchesFound;
        resetFlippedCards();
        if (totalMatchesFound === totalPairs) setTimeout(() => showGameEndMessage(), 500);
    }

    function handleMismatch() {
        setTimeout(() => {
            flippedCards.forEach(card => card.classList.remove('flipped'));
            resetFlippedCards();
            changePlayerTurn();
        }, 1000);
    }

    function resetFlippedCards() {
        flippedCards = [];
        lockBoard = false;
    }

    function incrementTotalMoves() {
        totalMoves++;
        totalMovesSpan.textContent = totalMoves;
    }

    function changePlayerTurn() {
        currentPlayer = (currentPlayer === 1) ? 2 : 1;
        currentPlayerSpan.textContent = currentPlayer;
        updateActivePlayerHighlight();
    }

    function updateActivePlayerHighlight() {
        playerScoreDivs.forEach((div, index) => {
            if (index === (currentPlayer - 1)) div.classList.add('active'); else div.classList.remove('active');
        });
    }
    
    function showGameEndMessage() {
        const maxScore = Math.max(...playerScores);
        const winners = [];
        playerScores.forEach((score, index) => {
            if (score === maxScore) winners.push(index + 1);
        });
        let msg = winners.length === 1 ? `🎉 O Jogador ${winners[0]} venceu!` : `🤝 Empate!`;
        resultMessage.textContent = msg;
        finalStats.innerHTML = `Jogador 1: <strong>${playerScores[0]}</strong> pares<br>Jogador 2: <strong>${playerScores[1]}</strong> pares<br>Total de Movimentos: <strong>${totalMoves}</strong>`;
        gameOverModal.style.display = 'flex';
    }

    resetButton.addEventListener('click', initializeGame);
    modalResetButton.addEventListener('click', initializeGame);
    gridSizeSelect.addEventListener('change', initializeGame);
    initializeGame();
    });
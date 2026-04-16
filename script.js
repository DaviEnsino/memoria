document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const gameBoard = document.getElementById('game-board');
    const totalMovesSpan = document.getElementById('total-moves');
    const totalMatchesSpan = document.getElementById('total-matches');
    const totalPairsSpan = document.getElementById('total-pairs');
    const resetButton = document.getElementById('reset-button');
    const currentPlayerSpan = document.getElementById('current-player');
    const gridSizeSelect = document.getElementById('grid-size-select'); // NOVO
    
    // Referências do Placar
    const playerScoreDivs = [
        document.getElementById('player-1-score'),
        document.getElementById('player-2-score'),
        document.getElementById('player-3-score'),
        document.getElementById('player-4-score')
    ];
    const playerScoreSpans = playerScoreDivs.map(div => div.querySelector('.score'));

    // ATUALIZADO: Lista completa de pares (agora com 10)
    const allCardDataPairs = [
        { pow: { id: '2^2', content: '2<sup>2</sup>' }, res: { id: '4', content: '4' } },
        { pow: { id: '3^2', content: '3<sup>2</sup>' }, res: { id: '9', content: '9' } },
        { pow: { id: '2^3', content: '2<sup>3</sup>' }, res: { id: '8', content: '8' } },
        { pow: { id: '4^2', content: '4<sup>2</sup>' }, res: { id: '16', content: '16' } },
        { pow: { id: '5^2', content: '5<sup>2</sup>' }, res: { id: '25', content: '25' } },
        { pow: { id: '3^3', content: '3<sup>3</sup>' }, res: { id: '27', content: '27' } },
        // --- Novos pares ---
        { pow: { id: '6^2', content: '6<sup>2</sup>' }, res: { id: '36', content: '36' } },
        { pow: { id: '2^5', content: '2<sup>5</sup>' }, res: { id: '32', content: '32' } },
        { pow: { id: '7^2', content: '7<sup>2</sup>' }, res: { id: '49', content: '49' } },
        { pow: { id: '4^3', content: '4<sup>3</sup>' }, res: { id: '64', content: '64' } }
    ];

    // Variáveis de estado do jogo
    let cards = [];
    let flippedCards = [];
    let lockBoard = false;
    let totalMoves = 0;
    let totalMatchesFound = 0;
    let totalPairs = 0; // ATUALIZADO: Será dinâmico
    let currentPlayer = 1;
    let playerScores = [0, 0, 0, 0];

    // --- Funções do Jogo ---

    // 1. Iniciar o Jogo (ou Reiniciar)
    function initializeGame() {
        // --- NOVO: Lógica de Tamanho do Grid ---
        const gridSize = gridSizeSelect.value;
        let pairsToUse = 0;
        let gridCols = 0;
        let gridRows = 0;

        switch (gridSize) {
            case '4x4':
                pairsToUse = 8;
                gridCols = 4;
                gridRows = 4;
                break;
            case '5x4':
                pairsToUse = 10;
                gridCols = 5;
                gridRows = 4;
                break;
            case '4x3':
            default:
                pairsToUse = 6;
                gridCols = 4;
                gridRows = 3;
        }
        
        totalPairs = pairsToUse;
        
        // NOVO: Define o CSS grid dinamicamente
        gameBoard.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${gridRows}, 1fr)`;
        // --- Fim da Lógica de Grid ---

        // Reseta o estado
        totalMoves = 0;
        totalMatchesFound = 0;
        flippedCards = [];
        lockBoard = false;
        currentPlayer = 1;
        playerScores = [0, 0, 0, 0];

        // Atualiza a UI
        totalMovesSpan.textContent = '0';
        totalMatchesSpan.textContent = '0';
        totalPairsSpan.textContent = totalPairs; // Atualiza o total de pares
        gameBoard.innerHTML = '';
        
        playerScoreSpans.forEach(span => span.textContent = '0');
        updateActivePlayerHighlight();

        // ATUALIZADO: Prepara o array de cartas
        // 1. Embaralha a lista principal de pares para pegar um subconjunto
        let selectedPairs = shuffle([...allCardDataPairs]).slice(0, pairsToUse);

        // 2. Duplica os pares selecionados
        let gameCards = [];
        selectedPairs.forEach(pair => {
            gameCards.push({ id: pair.pow.id, content: pair.pow.content, matchId: pair.res.id });
            gameCards.push({ id: pair.res.id, content: pair.res.content, matchId: pair.pow.id });
        });

        // 3. Embaralha as cartas finais e cria o tabuleiro
        cards = shuffle(gameCards);
        createBoard();
    }

    // 2. Embaralhar (Modifica o array original e o retorna)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 3. Criar o tabuleiro
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

    // 4. Virar a Carta
    function flipCard(event) {
        const clickedCard = event.currentTarget;

        if (lockBoard || 
            clickedCard.classList.contains('flipped') || 
            clickedCard.classList.contains('matched')) {
            return;
        }

        clickedCard.classList.add('flipped');
        flippedCards.push(clickedCard);

        if (flippedCards.length === 2) {
            lockBoard = true;
            incrementTotalMoves();
            checkForMatch();
        }
    }

    // 5. Checar Combinação
    function checkForMatch() {
        const [card1, card2] = flippedCards;
        const isMatch = (card1.dataset.id === card2.dataset.matchId) && 
                        (card2.dataset.id === card1.dataset.matchId);

        if (isMatch) {
            handleMatch();
        } else {
            handleMismatch();
        }
    }

    // 6. Se combinou (Acerto)
    function handleMatch() {
        flippedCards.forEach(card => card.classList.add('matched'));
        
        playerScores[currentPlayer - 1]++;
        playerScoreSpans[currentPlayer - 1].textContent = playerScores[currentPlayer - 1];
        
        totalMatchesFound++;
        totalMatchesSpan.textContent = totalMatchesFound;

        resetFlippedCards(); // Não troca o jogador

        if (totalMatchesFound === totalPairs) {
            setTimeout(() => {
                showGameEndMessage();
            }, 500);
        }
    }

    // 7. Se não combinou (Erro)
    function handleMismatch() {
        setTimeout(() => {
            flippedCards.forEach(card => card.classList.remove('flipped'));
            resetFlippedCards();
            changePlayerTurn(); // Passa o turno
        }, 1000);
    }

    // 8. Resetar cartas viradas
    function resetFlippedCards() {
        flippedCards = [];
        lockBoard = false;
    }

    // 9. Incrementar movimentos totais
    function incrementTotalMoves() {
        totalMoves++;
        totalMovesSpan.textContent = totalMoves;
    }

    // 10. Trocar o turno do jogador
    function changePlayerTurn() {
        currentPlayer = (currentPlayer % 4) + 1;
        currentPlayerSpan.textContent = currentPlayer;
        updateActivePlayerHighlight();
    }

    // 11. Atualizar destaque visual
    function updateActivePlayerHighlight() {
        playerScoreDivs.forEach((div, index) => {
            if (index === (currentPlayer - 1)) {
                div.classList.add('active');
            } else {
                div.classList.remove('active');
            }
        });
    }
    
    // 12. Mostrar mensagem de Fim de Jogo
    function showGameEndMessage() {
        const maxScore = Math.max(...playerScores);
        const winners = [];
        
        playerScores.forEach((score, index) => {
            if (score === maxScore) {
                winners.push(index + 1);
            }
        });

        let message = '';
        if (winners.length === 1) {
            message = `O Jogador ${winners[0]} venceu com ${maxScore} pares!`;
        } else {
            message = `Empate entre os Jogadores ${winners.join(' e ')} com ${maxScore} pares cada!`;
        }

        alert(`Fim de Jogo!\n\n${message}\n\nMovimentos Totais: ${totalMoves}`);
    }

    // --- Event Listeners ---
    resetButton.addEventListener('click', initializeGame);
    gridSizeSelect.addEventListener('change', initializeGame); // NOVO

    // Inicia o jogo pela primeira vez
    initializeGame();
});
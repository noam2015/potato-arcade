export const GameState = {
    state: 'START', // 'START', 'DIFFICULTY', 'GAMEOVER', or 'GAME1' through 'GAME30'
    currentDifficulty: 'medium',
    pendingGame: null,
    restartCurrentGame: null,
    animationId: null,
    lastTime: 0,
    visualEffects: [],
    
    // Canvas and Context references
    canvas: null,
    ctx: null,

    // Active mini-game instance
    currentGameInstance: null
};

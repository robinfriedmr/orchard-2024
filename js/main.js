// Initialize Phaser, add all game states, and start the 'boot' state

var game = new Phaser.Game(
    40 * 15,
    23 * 15,
    Phaser.AUTO, 'phasergame', 
    null, 
    false,
    false
);

// Add all the states
game.state.add('boot', bootState);
game.state.add('menu', menuState);

game.state.add('worm', wormState);
game.state.add('tree', treeState);
game.state.add('bird', birdState);

// Start the 'boot' state
game.state.start('boot');

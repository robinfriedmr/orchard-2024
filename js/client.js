/* Changes: 
* Re-ordered state management to the top, followed by signals "From Server", then by "From Game"
* Arrow notation for Server State Management and From Server
*/
const address = window.location.origin;
const Client = {};
Client.socket = io.connect(address);


/* From Game */
Client.askNewPlayer = function () {
    Client.socket.emit('newplayer');
};

Client.askWorm = function () {
    Client.socket.emit('wormRequest');
};

Client.askTree = function () {
    Client.socket.emit('treeRequest');
};

Client.askBird = function () {
    Client.socket.emit('birdRequest');
};

Client.sendNutrient = function () {
    Client.socket.emit('sendNutrient');
};

Client.pullNutrient = function () {
    Client.socket.emit('pullNutrient');
};

Client.sendApple = function () {
    Client.socket.emit('sendApple');
};

Client.sendDecay = function () {
    Client.socket.emit('sendDecay');
};

Client.sendSeed = function () {
    Client.socket.emit('sendSeed');
};


/* From Server */
Client.socket.on('you', (data) => {
    menuState.setID(data);
});

Client.socket.on('giveIDs', (data) => {
    menuState.giveIDs(data.wormPD, data.treePD, data.birdPD);
});

Client.socket.on('refreshID', (data) => {
    menuState.giveIDs(data.wormPD, data.treePD, data.birdPD);
});

Client.socket.on('receiveNutrient', () => {
    treeState.nutrientSupply();
});

Client.socket.on('eraseNutrient', () => {
    wormState.eraseNutrient();
});

Client.socket.on('receiveApple', () => {
    birdState.appleDrop();
});

Client.socket.on('receiveDecay', () => {
    wormState.newDecay();
});

Client.socket.on('plantRoot', () => {
    wormState.drawRoot(); 
});

Client.socket.on('updateScore', function (score) {
    wormState.updatewScore(score);
    treeState.updateScore(score);
    birdState.updateScore(score);
});



/* Server State Management */
Client.socket.on('wormGo', (data) => {
    menuState.startWorm(data);
});

Client.socket.on('wormNo', (data) => {
    menuState.wormNo(data);
});

Client.socket.on('treeGo', (data) => {
    menuState.startTree(data);
});

Client.socket.on('treeNo', (data) => {
    menuState.treeNo(data);
});

Client.socket.on('birdGo', (data) => {
    menuState.startBird(data);
});

Client.socket.on('birdNo', (data) => {
    menuState.birdNo(data);
});

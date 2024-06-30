const { join } = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Aliases for Requests
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));
// app.use('/favicon.ico', express.static(__dirname + 'favicon.ico'));

// HTTP GET Request/Response
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
})

// Listening on Port...
const port = 3333
server.listen(port, () => {
	console.log(`Listening on port ${port}`)
});

io.on('connection', (socket) => {
	console.log('Connected!');

    socket.on('newplayer', function () {
        // Server assigns an ID to the new player
        socket.player = {
            id: httpServer.lastPlayerID++,
        };
        console.log(`Welcome, Player ${socket.player.id}!`);

        // Server sends player their ID number
        socket.emit('you', socket.player.id);

        socket.on('disconnect', function () {
            console.log("Player " + socket.player.id + " disconnected.");

            // Check disconnecting player ID against currentData.
            // Change that game's player ID value back to -1 (an invalid ID).
            // Send the currentData out for all connected players. 

            if (socket.player.id == httpServer.currentData.wormPD) {
                playerMap[WORM_GAME] = -1
                httpServer.currentData.wormPD = -1;
                io.emit('refreshID', httpServer.currentData);
            } else if (socket.player.id == httpServer.currentData.treePD) {
                playerMap[TREE_GAME] = -1
                httpServer.currentData.treePD = -1;
                io.emit('refreshID', httpServer.currentData);
            } else if (socket.player.id == httpServer.currentData.birdPD) {
                playerMap[BIRD_GAME] = -1
                httpServer.currentData.birdPD = -1;
                io.emit('refreshID', httpServer.currentData);
            } else {
                return;
            }

        });

        // ************ BEGIN STATE REQUEST FUNCTIONS ***************
        socket.on('wormRequest', function () {
            // The player who requested Worm is given their own ID.
            socket.emit('wormGo', socket.player.id);
            playerMap[WORM_GAME] = socket.id;

            // Everyone else is not allowed to choose Worm.
            httpServer.currentData.wormPD = socket.player.id; // update currentData object on server
            socket.broadcast.emit('wormNo', httpServer.currentData.wormPD); // emit the new value of wormPD
            console.log(httpServer.currentData.wormPD + " is the player ID value of wormPD.");
        });
        socket.on('treeRequest', function () {
            // The player who requested Tree is given their own ID.
            socket.emit('treeGo', socket.player.id);
            playerMap[TREE_GAME] = socket.id;

            // Everyone else is not allowed to choose Tree.
            httpServer.currentData.treePD = socket.player.id;
            socket.broadcast.emit('treeNo', httpServer.currentData.treePD);
            console.log(httpServer.currentData.treePD + " is the Tree player.")
        });
        socket.on('birdRequest', function () {
            // The player who requested Bird is given their own ID.
            socket.emit('birdGo', socket.player.id);
            playerMap[BIRD_GAME] = socket.id;

            // Everyone else is not allowed to choose Bird.
            httpServer.currentData.birdPD = socket.player.id;
            socket.broadcast.emit('birdNo', httpServer.currentData.birdPD);
            console.log(httpServer.currentData.birdPD + " is the Bird player.")
        });
        // ************* END REQUEST FUNCTIONS ***************

        console.log("Sending the following to new players:"); // Has data been defined, and if so, how so?
        if (httpServer.currentData.wormPD >= 0 || httpServer.currentData.treePD >= 0 || httpServer.currentData.birdPD >= 0) {
            socket.emit('giveIDs', httpServer.currentData); // Send currentData object (with IDs inside).
            console.log(httpServer.currentData);
        } else {
            console.log("No role has been given a valid player ID.");
        }

        // ************* BEGIN BATON PASS ********************
        socket.on('sendNutrient', function () {
            console.log("server has wormplayer's nutrient");
            if (playerMap[TREE_GAME] != -1) {
                socket.to(playerMap[TREE_GAME]).emit('receiveNutrient');
            }
        });

        socket.on('pullNutrient', function () {
            console.log("tree is pulling the nutrient from worm");
            if (playerMap[WORM_GAME] != -1) {
                socket.to(playerMap[WORM_GAME]).emit('eraseNutrient');
            }
        });

        socket.on('sendApple', function () {
            console.log("server has the tree's apple");
            if (playerMap[BIRD_GAME] != -1) {
                socket.to(playerMap[BIRD_GAME]).emit('receiveApple');
            }
        });

        socket.on('sendDecay', function () {
            console.log("server has the bird's decaying apple");
            if (playerMap[WORM_GAME] != -1) {
                socket.to(playerMap[WORM_GAME]).emit('receiveDecay');
            }
        });

        // Score!
        socket.on('sendSeed', function () {
            console.log("Server has planted the seed.");
            if (playerMap[WORM_GAME] != -1) {
                socket.to(playerMap[WORM_GAME]).emit('plantRoot'); // tell the worm player to have a new root
            }
            httpServer.score++; //increase server score
            console.log("The score is now " + httpServer.score);
            io.emit('updateScore', httpServer.score);
        });
        // ************* END BATON PASS ********************
    });

	// socket.on('disconnect', () => {
	// 	console.log('Disconnected.')
	// })
})

// Players and Score
server.lastPlayerID = 0; // Newest visitor?
server.currentData = {
    wormPD: -1,
    treePD: -1,
    birdPD: -1
};

var playerMap = [-1, -1, -1]; // Player IDs for each mini game -- How is this map different from server.currentData?
const WORM_GAME = 0;
const TREE_GAME = 1;
const BIRD_GAME = 2;

server.score = 0;

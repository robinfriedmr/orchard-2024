// Requiring = importing
// Import express, from http import createServer, from socket.io import Server, ...
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express(); // express application
const server = createServer(app); // express HTTP server
const io = new Server(server); // socket.io express HTTP server

// Aliases for Requests
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))
app.use('/assets', express.static(__dirname + '/assets'))
app.use('/favicon.ico', express.static(__dirname + 'favicon.ico'));

// HTTP GET Request/Response
app.get('/', (req, res) => {
	res.sendFile(join(__dirname, 'index.html'))
})

// Server is listening on Port...
const port = 3333
server.listen(port, () => {
	console.log(`Listening on port ${port}`)
})

// IO/socket events
io.on('connection', (socket) => {
    // On connection, log message
	console.log('Connected!')

    // When the given socket emits "newplayer", do these...
	socket.on('newplayer', function () {
		// Server assigns an ID to the new player
		socket.player = {
			id: server.lastPlayerID++,
		}
		console.log(`Welcome, Player ${socket.player.id}!`)

		// Server sends player their ID number
		socket.emit('you', socket.player.id)

		socket.on('disconnect', function () {
			console.log('Player ' + socket.player.id + ' disconnected.')

			// Check disconnecting player ID against currentData.
			// Change that game's player ID value back to -1 (an invalid ID).
			// Send the currentData out for all connected players.

			if (socket.player.id == server.currentData.wormPD) {
				playerMap[WORM_GAME] = -1
				server.currentData.wormPD = -1
				io.emit('refreshID', server.currentData)
			} else if (socket.player.id == server.currentData.treePD) {
				playerMap[TREE_GAME] = -1
				server.currentData.treePD = -1
				io.emit('refreshID', server.currentData)
			} else if (socket.player.id == server.currentData.birdPD) {
				playerMap[BIRD_GAME] = -1
				server.currentData.birdPD = -1
				io.emit('refreshID', server.currentData)
			} else {
				return
			}

			// If no player is left in any minigame, reset the server score.
			if (playerMap[WORM_GAME] == -1 && playerMap[TREE_GAME] == -1 && playerMap[BIRD_GAME] == -1) {
				console.log("Resetting score.");
				server.score = 0;
			}
		})

		// ** BEGIN GAME STATE REQUEST FUNCTIONS **
		socket.on('wormRequest', function () {
			// The player who requested Worm is given their own ID.
			socket.emit('wormGo', socket.player.id)
			playerMap[WORM_GAME] = socket.id

			// No one else may choose Worm.
			server.currentData.wormPD = socket.player.id // update currentData object on server
			socket.broadcast.emit('wormNo', server.currentData.wormPD) // emit the new value of wormPD
			console.log(`Player ${server.currentData.wormPD} is the Worm.`);
		})
		socket.on('treeRequest', function () {
			// The player who requested Tree is given their own ID.
			socket.emit('treeGo', socket.player.id)
			playerMap[TREE_GAME] = socket.id

			// No one else may choose Tree.
			server.currentData.treePD = socket.player.id
			socket.broadcast.emit('treeNo', server.currentData.treePD)
			console.log(`Player ${server.currentData.treePD} is the Tree.`);
		})
		socket.on('birdRequest', function () {
			// The player who requested Bird is given their own ID.
			socket.emit('birdGo', socket.player.id)
			playerMap[BIRD_GAME] = socket.id

			// No one else may choose Bird.
			server.currentData.birdPD = socket.player.id
			socket.broadcast.emit('birdNo', server.currentData.birdPD)
			console.log(`Player ${server.currentData.birdPD} is the Bird.`);
		})
		// ** END GAME STATE REQUEST FUNCTIONS **

		// Emit player mapping if any minigame has a valid player ID
		if (
			server.currentData.wormPD >= 0 ||
			server.currentData.treePD >= 0 ||
			server.currentData.birdPD >= 0
		) {
			socket.emit('giveIDs', server.currentData) // Send currentData (has player IDs) for Menu State
			console.log(server.currentData)
		} else {
			console.log('No role has been given a valid player ID.')
		}

		// ** BEGIN BATON PASS **
		socket.on('sendNutrient', function () {
			console.log("server has wormplayer's nutrient")
			if (playerMap[TREE_GAME] != -1) {
				socket.to(playerMap[TREE_GAME]).emit('receiveNutrient')
			}
		})

		socket.on('pullNutrient', function () {
			console.log('tree is pulling the nutrient from worm')
			if (playerMap[WORM_GAME] != -1) {
				socket.to(playerMap[WORM_GAME]).emit('eraseNutrient')
			}
		})

		socket.on('sendApple', function () {
			console.log("server has the tree's apple")
			if (playerMap[BIRD_GAME] != -1) {
				socket.to(playerMap[BIRD_GAME]).emit('receiveApple')
			}
		})

		socket.on('sendDecay', function () {
			console.log("server has the bird's decaying apple")
			if (playerMap[WORM_GAME] != -1) {
				socket.to(playerMap[WORM_GAME]).emit('receiveDecay')
			}
		})

		// Score!
		socket.on('sendSeed', function () {
			console.log('Seed planted.');
			if (playerMap[WORM_GAME] != -1) {
				socket.to(playerMap[WORM_GAME]).emit('plantRoot') // tell the worm player to have a new root
			}
			server.score++ //increase server score
			console.log(`Score: ${server.score}`);
			io.emit('updateScore', server.score)
		})
		// ** END BATON PASS **
	})

    // On disconnection, log message
	socket.on('disconnect', () => {
		console.log('Disconnected.')
	})
})

// Players and Score
server.score = 0

server.lastPlayerID = 0 // Newest visitor?
server.currentData = {
	wormPD: -1,
	treePD: -1,
	birdPD: -1,
}

var playerMap = [-1, -1, -1] // Player IDs for each minigame -- How is this map different from server.currentData?
const WORM_GAME = 0
const TREE_GAME = 1
const BIRD_GAME = 2

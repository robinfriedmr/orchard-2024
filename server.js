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
		// Assign ID to the new player, increment for next player's ID
		socket.player = {
			id: server.lastPlayerID++,
		}
		// Send ID number to the new player
		socket.emit('yourID', socket.player.id);
		console.log(`Welcome, Player ${socket.player.id}!`);

		socket.on('disconnect', function () {
			console.log(`Player ${socket.player.id} disconnected.`);

			// Check disconnecting player's ID against playerMap
			// Change any corresponding mapping back to -1, then emit updated playerMap
			if (socket.player.id == server.playerMap.wormPD) {
				server.playerMap.wormPD = -1
				server.playerMap.wormPD = -1
				io.emit('giveIDs', server.playerMap)
			} else if (socket.player.id == server.playerMap.treePD) {
				server.playerMap.treePD = -1
				server.playerMap.treePD = -1
				io.emit('giveIDs', server.playerMap)
			} else if (socket.player.id == server.playerMap.birdPD) {
				server.playerMap.birdPD = -1
				server.playerMap.birdPD = -1
				io.emit('giveIDs', server.playerMap)
			} else {
				return
			}

			// If no player is left in any minigame, reset the server score
			if (server.playerMap.wormPD == -1 && server.playerMap.treePD == -1 && server.playerMap.birdPD == -1) {
				console.log("Resetting score.");
				server.score = 0;
			}
		})

		// ** BEGIN GAME STATE REQUEST FUNCTIONS **
		socket.on('wormRequest', function () {
			// The player who requested Worm is given their own ID.
			socket.emit('wormGo', socket.player.id)
			server.playerMap.wormPD = socket.id

			// No one else may choose Worm.
			server.playerMap.wormPD = socket.player.id // update playerMap object on server
			socket.broadcast.emit('wormNo', server.playerMap.wormPD) // emit the new value of wormPD
			console.log(`Player ${server.playerMap.wormPD} is the Worm.`);
		})
		socket.on('treeRequest', function () {
			// The player who requested Tree is given their own ID.
			socket.emit('treeGo', socket.player.id)
			server.playerMap.treePD = socket.id

			// No one else may choose Tree.
			server.playerMap.treePD = socket.player.id
			socket.broadcast.emit('treeNo', server.playerMap.treePD)
			console.log(`Player ${server.playerMap.treePD} is the Tree.`);
		})
		socket.on('birdRequest', function () {
			// The player who requested Bird is given their own ID.
			socket.emit('birdGo', socket.player.id)
			server.playerMap.birdPD = socket.id

			// No one else may choose Bird.
			server.playerMap.birdPD = socket.player.id
			socket.broadcast.emit('birdNo', server.playerMap.birdPD)
			console.log(`Player ${server.playerMap.birdPD} is the Bird.`);
		})
		// ** END GAME STATE REQUEST FUNCTIONS **

		// Emit player mapping if any minigame has a valid player ID
		if (
			server.playerMap.wormPD >= 0 ||
			server.playerMap.treePD >= 0 ||
			server.playerMap.birdPD >= 0
		) {
			socket.emit('giveIDs', server.playerMap) // Send playerMap (has player IDs) for Menu State
			console.log(server.playerMap)
		} else {
			console.log('No role has been given a valid player ID.')
		}

		// ** BEGIN BATON PASS **
		socket.on('sendNutrient', function () {
			console.log("server has wormplayer's nutrient")
			if (server.playerMap.treePD != -1) {
				socket.to(server.playerMap.treePD).emit('receiveNutrient')
			}
		})

		socket.on('pullNutrient', function () {
			console.log('tree is pulling the nutrient from worm')
			if (server.playerMap.wormPD != -1) {
				socket.to(server.playerMap.wormPD).emit('eraseNutrient')
			}
		})

		socket.on('sendApple', function () {
			console.log("server has the tree's apple")
			if (server.playerMap.birdPD != -1) {
				socket.to(server.playerMap.birdPD).emit('receiveApple')
			}
		})

		socket.on('sendDecay', function () {
			console.log("server has the bird's decaying apple")
			if (server.playerMap.wormPD != -1) {
				socket.to(server.playerMap.wormPD).emit('receiveDecay')
				console.log("Server has given Worm the decay")
			}
		})

		// Score!
		socket.on('sendSeed', function () {
			console.log('Seed planted.');
			if (server.playerMap.wormPD != -1) {
				socket.to(server.playerMap.wormPD).emit('plantRoot') // tell the worm player to have a new root
			}
			server.score++ // Increment score
			console.log(`Score: ${server.score}`);
			io.emit('updateScore', server.score); // What's the difference between emit and broadcast.emit, and does it matter?
		})
		// ** END BATON PASS **
	})

    // On disconnection, log message
	socket.on('disconnect', () => {
		console.log('Disconnected.')
	})
})

// Player IDs
server.lastPlayerID = 0
server.playerMap = {
	wormPD: -1,
	treePD: -1,
	birdPD: -1,
}

// Progress and Score
server.score = 0
server.wormData = {
	roots: [
		// ? Never developed meaningfully
	],
	nutrients: {
		held: 0,
		delivered: 0,
		dirt: [
			// {x, y}
		]
	}
}
server.treeData = {
	totalCreated: 0,
	current: 0 // 0 = green, 1 = yellow, 2 = red?
}
server.birdData = {
	trees: [
		// {x, variant (or frame?), growth stage (depending what the end game is?)}
	]
}

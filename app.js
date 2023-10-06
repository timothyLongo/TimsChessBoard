// MANY THANKS GOES TO 'CODE WITH ANIA KUBOW'
// https://www.youtube.com/watch?v=Qv0fvm5B0EM&list=PL4ntBt81cc8VDhQ7yZFdxS09CLNLhY5D7&index=1
// FOR LAYING THE FOUNDATION AND INSPIRING ME TO COMPLETE
// THIS PROJECT
//
// AND THE DRAG-DROP-SIMULATOR GUY
// https://ghostinspector.com/blog/simulate-drag-and-drop-javascript-casperjs/
//
// BELOW IS WHAT I'VE DONE TO COMPLETE THIS PROJECT
//
// ALL FUNNY JUMPING MOVES ARE FIXED -- (new coordinate system is responsible for this)
// EVERY LEGAL MOVE VALIDATED -- (enpassent, castling rights, no castling through check, queening etc.)
// CHECK DETECTION AND VALIDATION -- (not only is check detected, but one may not PUT oneself in check)
//
// I accomplished this by adding a 'range' for each color
// in each 'range' array is every coordinate that every piece of that color observes
// if the king's coordinate square is in the opponents range, then we have check

// What I wish I had accomplished:
// : Mate detection
// : Queening piece selection
// : Move log with buttons to replay through the moves

const gameBoard = document.querySelector("#board"); // this grabs the HTML id and places it into this
// new variable we define here
const playerDisplay = document.querySelector("#player");
const infoDisplay = document.querySelector("#info-display");

const width = 8; // defines the width of our array to a constant 8

let playerGo = 'white'
const startPieces = [  // note these pieces are recognized because we
	// defined them in the previously called pieces.js
	rook, knight, bishop, queen, king, bishop, knight, rook,
	pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
	'', '', '', '', '', '', '', '', // these are recognized as blank spaces
	'', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '',
	pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
	rook, knight, bishop, queen, king, bishop, knight, rook
]
const chessAlphabet = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
const chessNumAlphabet = [8, 7, 6, 5, 4, 3, 2, 1]
// we're going backwards because somehow the below function
// seems to populate right to left bottom to top

// QUEENING TESTING BELOW
// 
const queeningPiece = [queen]

function createBoard() {
	startPieces.forEach((startPiece, i) => { // i simply defines the iteration
		// note: 'startPiece' is just arbitrarily defined here for functionality
		// we could call it and define it as anything
		const square = document.createElement('div'); // constant variable 'square'
		// assigned to a blank div
		square.classList.add('square'); // this creates the class 'square' which 
		// is given size dimensions in our CSS file
		square.innerHTML = startPiece; // each square assigned with startPiece
		// in the order that is defined by the vector
		// within that div, with its own class and id, defined in pieces.js
		square.firstChild?.setAttribute('draggable', true) // if the square has
		// a first child, then set an attribute 'draggable' with value 'true'

		square.firstChild?.setAttribute('moved', false)
		// this will prove useful for the castling mechanics
		// king and rook may castle only if both arrtributes are false
		// in dragDrop() function we will change this to true

		square.setAttribute('square-id', i) // this sets an attribute of 'square-id'
		// to the newly created and populate div itself, with the iteration number
		const row = Math.floor(( (63 - i) / 8) + 1)
		if (row % 2 === 0) { // if row is divisible by 2
			square.classList.add(i % 2 === 0 ? "beige" : "brown")
			// if i is divisible by 2, make square beige, otherwise make is brown
			// this alternates the entire row starting with beige
		} else {
			square.classList.add(i % 2 === 0 ? "brown" : "beige")
			// if i is divisible by 2, make square brown, otherwise make is beige
			// this alternates the entire row starting with brown
		}

		if ( i < 16) {
			square.firstChild.firstChild.classList.add('black')
		}
		if ( i > 47) {
			square.firstChild.firstChild.classList.add('white')
		}
		gameBoard.append(square); // add the div element of 100px by 100px 
		// that we created to 'gameBoard' variable which really targets
		// the #board from our HTML

		// we will add enpassent attribute here when we create the board
		if (square.firstChild?.getAttribute('id') === 'pawn') {
			square.firstChild.setAttribute('enpassent', false)
		} // beautiful


		// attempt for a coordinate system to correct many bugs such as illegal moves
		const rankNumber = Math.floor(( (63 - i) / 8) + 1)
		square.setAttribute('rank-number', rankNumber)
		const fileLetter = chessAlphabet.at((63 - i) % 8)
		square.setAttribute('file-letter', fileLetter)
		square.setAttribute('coordinate', fileLetter + rankNumber)
		// success
		const fileNum = chessNumAlphabet.at((63 - i) % 8)
		square.setAttribute('file-num', fileNum)

	})
}


createBoard() // this CALLS the function when the script is read
// first html links the script, the script is read through, then we call this 
// previously defined function above, at the end of the script after it's defined
reverseIds()

const allSquares = document.querySelectorAll(".square")
// look everywhere for an element with the ID 'board'
// then grab every element inside of that with the class 'square'
allSquares.forEach(square => {
	square.addEventListener('dragstart', dragStart)
	// for every 64 squares, listen out for a 'dragstart' event
	// then call function 'dragStart'
	square.addEventListener('dragover', dragOver)
	square.addEventListener('drop', dragDrop)
	// these are all recognized by js, all events to listen out for
})

let startPositionId // this establishes a variable as null
let draggedElement // this establishes a variable as null

let startCoordinate
let startRank
let startFileLetter
let startSquare
function dragStart(e) { // passing through 'e' for event
	startPositionId = e.target.parentNode.getAttribute('square-id')
	// get the parent div of the square's target
	// then get the attribute of 'square-id'
	// this is the square id iteration number from which it starts to drag

	startCoordinate = e.target.parentNode.getAttribute('coordinate')
	startRank = e.target.parentNode.getAttribute('rank-number')
	startFileLetter = e.target.parentNode.getAttribute('file-letter')
	// when you start dragging, get the start square file letter
	startFileNumId = e.target.parentNode.getAttribute('file-num')
	draggedElement = e.target

	startSquare = e.target.parentNode
}

function dragOver(e) {
	e.preventDefault() // stops unwanted behavior
}

queeningInProgress = false
enpassentInProgress = false
movingPieceBackInProgress = false

let lastPieceTakenBuffer = []
pieceJustCaptured = false

let lastMoveBuffer = []
// what do we need to store in this variable
// for it to function properly?
// the piece, the color
// the index in its array
// and the square it CAME FROM
// we only need index of piece in array + end square to
// simulate a move

// we will clear this every time at the start of dragDrop
// and just before changePlayer() is called
// will will add piece's index of it's array
// and the target square to this array
// and this array is global
// so we need only call
// simulated dragDrop(array[0], array[1])
// and we're there
let movedAttributeTempBuffer = []

function dragDrop(e) {
	e.stopPropagation() // stops unwanted behavior
	

	const valid = playerGo === 'white' ? checkIfValidWhite(e.target) : checkIfValidBlack(e.target)
	// if white goes, check validation for white
	// otherwise, check validation for black

	const correctGo = draggedElement.firstChild.classList.contains(playerGo)

	// this makes sure the draggedElement, or dragged piece
	// is in fact, the color piece of the player's turn
	const opponentGo = playerGo === 'black' ? 'white' : 'black'
	// if player's turn was black when dropped?, then we want to allow white to move
	// move otherwise : it'll be black to move

	const taken = e.target.firstChild?.classList.contains('piece')

	// below is a functioning line, if errors are thrown, put back into code
	// const takenByOpponent = e.target.firstChild?.classList.contains(opponentGo)

	const takenByOpponent = e.target.firstChild?.classList.contains(opponentGo)

	// when dropped, if the target of the event has a first child
	// make sure it contains the opponents piece

	const takenBySelf = e.target.firstChild?.classList.contains(playerGo)
	// if the square's first child is occupied by a piece containing the same color
	// as the dragged piece



	if (correctGo || fakeDropInProgress === true) { // if one move's one's own color piece
		// must check this first

		
		// moving piece back because player is still in check logic goes here
		if (movingPieceBackInProgress === true) {
			movingPieceBackInProgress = false

			e.target.append(draggedElement)
			// movedAttributeTempBuffer
			// this really only applies to kings and rooks for the sake of
			// castling rights
			// so if a piece is dropped, and it's a king or a rook -
			// we getAttribute('moved') and store it in the buffer
			// BEFORE it would ordinarly be assigned 'moved' to true
			// so we store the value before this happens
			// now if the temp buffer reads false
			// then when we move the piece back, we assign the attribute back
			if (movedAttributeTempBuffer.includes('false')) {
				draggedElement.setAttribute('moved', false)
			}
			// now if a piece was taken
			// we must place this piece back
			// .append(taken piece) back to the square
			// make sure it's correct with correct color
			// in the correct array
			// and complete
			// we will do this with a 'last piece taken buffer array'
			// AND a piece just captured switch
			if (pieceJustCaptured === true) {
				// we need the coordinate square of the last piece captured
				// not the general div
				tempCoordinate = lastPieceTakenBuffer[1]
				tempPiece = lastPieceTakenBuffer[0]
				tempColor = lastPieceTakenBuffer[2]
				
				document.querySelector(`[coordinate="${tempCoordinate}"]`).append(tempPiece)
				document.querySelector(`[coordinate="${tempCoordinate}"]`).firstChild.setAttribute('class', 'piece')
				// document.querySelector(`[coordinate="${tempCoordinate}"]`).innerHTML = 
				document.querySelector(`[coordinate="${tempCoordinate}"]`).firstChild.firstChild.setAttribute('class', tempColor)

				// THEN we add this to the appropriate piece array
				if (tempColor == 'black') {
					allBlackPiecesArray.push(document.querySelector(`[coordinate="${tempCoordinate}"]`).firstChild.firstChild)
				}
				if (tempColor == 'white') {
					allWhitePiecesArray.push(document.querySelector(`[coordinate="${tempCoordinate}"]`).firstChild.firstChild)
				}

			}

			///
			return true
		}


		// ENPASSENT logic goes below here
		if ((valid) && (enpassentInProgress === true) && (fakeDropInProgress === false)) {
			// remove the captured piece from the appropriate array
			// remove the captured piece from the board
			// place the dragged pawn in its place

			// remove the captured piece from the appropriate array
			// this piece is NOT the target, it's always 1 off the rank num of the target
			// with different signs for black or white
			// so to target the pawn to remove via enpassent we do this
			let tempRankNum = Number(e.target.getAttribute('rank-number'))
			let tempFileNum = Number(e.target.getAttribute('file-num'))
			let tempPawnRemovalSquare
			if (playerGo === 'white'){
				tempPawnRemovalSquare = document.querySelector(`[rank-number="${tempRankNum - 1}"][file-num="${tempFileNum}"]`)
			}
			if (playerGo === 'black'){
				tempPawnRemovalSquare = document.querySelector(`[rank-number="${tempRankNum + 1}"][file-num="${tempFileNum}"]`)
			}
			// now we remove it from the array
			if (tempPawnRemovalSquare.firstChild.firstChild.getAttribute('class') === 'black') {
				let index = allBlackPiecesArray.indexOf(tempPawnRemovalSquare.firstChild.firstChild)
				allBlackPiecesArray.splice(index, 1)
			}
			if (tempPawnRemovalSquare.firstChild.firstChild.getAttribute('class') === 'white') {
				let index = allWhitePiecesArray.indexOf(tempPawnRemovalSquare.firstChild.firstChild)
				allWhitePiecesArray.splice(index, 1)
			}
			// remove it from the board
			tempPawnRemovalSquare.firstChild.remove()
			// place the dragged piece to the square
			e.target.append(draggedElement)
			
			enpassentInProgress = false
			enpassentRule()
			changePlayer()
			return true
		}

		// QUEENING DOES NOT FOLLOW THE SAME LOGIC HERE FOR SOME REASON
		// so we will create a new branch JUST for queening to follow
		// we're gonna use a 'Queening-switch' JUST to be absolutely certain
		// no other move other than a queening move takes this branch

		if ( // QUEENING BRANCH FOR IF A PAWN CAPTURES
			(fakeDropInProgress === false) // only for queening, not simulated drops
			&& (valid)
			&& (takenByOpponent)
			&& (queeningInProgress === true)
			) {

			// remove the captured piece from the appropriate array
			if (e.target.firstChild.getAttribute('class') === 'black') {
				let index = allBlackPiecesArray.indexOf(e.target.firstChild)
				allBlackPiecesArray.splice(index, 1)
			}
			if (e.target.firstChild.getAttribute('class') === 'white') {
				let index = allWhitePiecesArray.indexOf(e.target.firstChild)
				allWhitePiecesArray.splice(index, 1)
			}
			// identify the correct square to add the queen
			let correctSquareCoordinate = e.target.parentNode.getAttribute('coordinate')

			
			// now we first remove the dragged queening pawn from the appropriate array
			if (draggedElement.firstChild.getAttribute('class') === 'black') {
				let index = allBlackPiecesArray.indexOf(draggedElement.firstChild)
				allBlackPiecesArray.splice(index, 1)
			}
			if (draggedElement.firstChild.getAttribute('class') === 'white') {
				let index = allWhitePiecesArray.indexOf(draggedElement.firstChild)
				allWhitePiecesArray.splice(index, 1)
			}

			// remove the captured piece from the board
			e.target.remove()

			// morph the pawn to the queen
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).append(draggedElement)
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).innerHTML = queeningPiece
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.setAttribute('draggable', true)
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.setAttribute('moved', true)
			let colorOfQueen = draggedElement.firstChild.getAttribute('class')
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.firstChild.setAttribute('class', colorOfQueen)
			// now add this queen to the appropriate array
			if (colorOfQueen === 'black') {
				allBlackPiecesArray.push(document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.firstChild)
			}
			if (colorOfQueen === 'white') {
				allWhitePiecesArray.push(document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.firstChild)
			}

			queeningInProgress = false
			enpassentRule()
			changePlayer()
			return
		}


		// QUEENING BRANCH FOR IF A PAWN MOVES FREELY TO THE BACK RANK
		if (
			(fakeDropInProgress === false) // only for queening, not simulated drops
			&& (valid)
			&& (!takenByOpponent)
			&& (queeningInProgress === true)
			) {

			// identify the correct square to add the queen
			let correctSquareCoordinate = e.target.getAttribute('coordinate')

			// now we first remove the dragged queening pawn from the appropriate array
			if (draggedElement.firstChild.getAttribute('class') === 'black') {
				let index = allBlackPiecesArray.indexOf(draggedElement.firstChild)
				allBlackPiecesArray.splice(index, 1)
			}
			if (draggedElement.firstChild.getAttribute('class') === 'white') {
				let index = allWhitePiecesArray.indexOf(draggedElement.firstChild)
				allWhitePiecesArray.splice(index, 1)
			}

			// morph the pawn to the queen
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).append(draggedElement)
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).innerHTML = queeningPiece
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.setAttribute('draggable', true)
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.setAttribute('moved', true)
			let colorOfQueen = draggedElement.firstChild.getAttribute('class')
			document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.firstChild.setAttribute('class', colorOfQueen)
			// now add this queen to the appropriate array
			if (colorOfQueen === 'black') {
				allBlackPiecesArray.push(document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.firstChild)
			}
			if (colorOfQueen === 'white') {
				allWhitePiecesArray.push(document.querySelector(`[coordinate="${correctSquareCoordinate}"]`).firstChild.firstChild)
			}

			queeningInProgress = false
			enpassentRule()
			changePlayer()
			return
		}

		// we're gonna wrap the whole thing in this if statement
		if (fakeDropInProgress === true) {
			const takenByOpponent = e.target.firstChild?.firstChild?.classList.contains(opponentGo)

			if (valid && takenByOpponent) {
				if (playerGo === 'white') {
					whitePiecesRange.push(e.target.getAttribute('coordinate'))
				}
				if (playerGo === 'black') {
					blackPiecesRange.push(e.target.getAttribute('coordinate'))
				}
				
				fakeDropInProgress = false
				return false
			}
		}

		if (valid && takenByOpponent) {
			if (
				(draggedElement.getAttribute('id') === 'rook') ||
				(draggedElement.getAttribute('id') === 'king')
				) {
					movedAttributeTempBuffer.splice(0, 1, draggedElement.getAttribute('moved'))
				}
			draggedElement.setAttribute('moved', true)
			e.target.parentNode.append(draggedElement)

			// the target of the event is the piece, so grab
			// the parent node of the DROP, which is the square itself
			// and append the draggedElement

			// we need to identify the color of the piece
			// as well as the piece within the array and remove it
			// we will do this via the splice method
			// array.splice(index here, number of items to remove here)

			// step 1 - find e.target
			// step 2 - find the color of that piece
				// e.target.firstChild.getAttribute('class')
			// step 3 - find the index of the piece in the array
				// indexOf() simple enough
			// step 4 - remove from the index
				// array.splice(index here, number of items to remove here)
			// step 5 - complete

			if (e.target.firstChild.getAttribute('class') === 'black') {
				let index = allBlackPiecesArray.indexOf(e.target.firstChild)
				allBlackPiecesArray.splice(index, 1)
			}
			if (e.target.firstChild.getAttribute('class') === 'white') {
				let index = allWhitePiecesArray.indexOf(e.target.firstChild)
				allWhitePiecesArray.splice(index, 1)
			}
			// now we will also add the last captured piece buffer
			
			lastPieceTakenBuffer.splice(0, 1, e.target)
			// and lets add the square it came from as well
			// just for simplicity, may not be necessary
			lastPieceTakenBuffer.splice(1, 1, e.target.parentNode.getAttribute('coordinate'))
			lastPieceTakenBuffer.splice(2, 1, e.target.firstChild.getAttribute('class'))
			// this reads, at index 0, remove 1 and place e.target
			// this keeps the buffer remaining just that, a buffer
			// holding only 1 at a time for our purposes and intentions
			e.target.remove()

			// remove the piece occupying the square before
				// BUG TO FIX HERE
				// when the piece is removed
				// it's removed from the board
				// but not the allWhite/BlackPieces Array
				// this causes the board to malfunction
				// because our check methodology checks every
				// piece in that array, and it throws an error
				// because that piece is in the array and not on the board
				// so -- we will remove this from the array
				// BEFORE	we remove from the board
			// BUG FIXED
			if (draggedElement.firstChild.getAttribute('class') === 'black') {
				let index = allBlackPiecesArray.indexOf(draggedElement.firstChild)
				lastMoveBuffer.splice(0, 1, allBlackPiecesArray[index].parentNode)
			}
			if (draggedElement.firstChild.getAttribute('class') === 'white') {
				let index = allWhitePiecesArray.indexOf(draggedElement.firstChild)
				lastMoveBuffer.splice(0, 1, allWhitePiecesArray[index].parentNode)
			}
			//
			lastMoveBuffer.splice(1, 1, startSquare)
			enpassentRule()
			changePlayer()
			pieceJustCaptured = true
			letsSeeIfYouAreInCheck()
			// calls changePlayer every time something is dropped
			fakeDropInProgress = false // this line is just a guess attempt really
			// it might throw all of the mechanics of everything off
			// or it might fix this small bug we're looking at
			// BUG FIXED
			return // return out of function
		}
		else if (takenBySelf) {
			if(fakeDropInProgress === true) {
				fakeDropInProgress = false
			}
			return false
		}
		else if (!valid) {
			if(fakeDropInProgress === true) {
				fakeDropInProgress = false
			}
			return false
		}
		
		else if (valid && !taken) {

			// if special case triggered this event,
			// do something here
			// then break
			if(fakeDropInProgress === true) {
				// add the square to the array
				if (playerGo === 'white') {
				whitePiecesRange.push(e.target.getAttribute('coordinate'))
				}
				if (playerGo === 'black') {
				blackPiecesRange.push(e.target.getAttribute('coordinate'))
				}

				fakeDropInProgress = false
				return false 
			}
			if (
				(draggedElement.getAttribute('id') === 'rook') ||
				(draggedElement.getAttribute('id') === 'king')
				) {
					movedAttributeTempBuffer.splice(0, 1, draggedElement.getAttribute('moved'))
				}

			draggedElement.setAttribute('moved', true)
	        // this marks each piece as its dropped to indicate that it is no longer untouched
			// we only mark it 'moved' if it was FIRST validated
			e.target.append(draggedElement)

			// here will will add to our lastMoveBuffer array
			// we need piece's index in its array
			// (draggedElement)
			// and we need square draggedElement came from
			// startSquare

			if (draggedElement.firstChild.getAttribute('class') === 'black') {
				let index = allBlackPiecesArray.indexOf(draggedElement.firstChild)
				lastMoveBuffer.splice(0, 1, allBlackPiecesArray[index].parentNode)
			}
			if (draggedElement.firstChild.getAttribute('class') === 'white') {
				let index = allWhitePiecesArray.indexOf(draggedElement.firstChild)
				lastMoveBuffer.splice(0, 1, allWhitePiecesArray[index].parentNode)
			}
			//
			lastMoveBuffer.splice(1, 1, startSquare)

			enpassentRule()
			changePlayer()
			pieceJustCaptured = false
			isItMate()
			letsSeeIfYouAreInCheck()

			fakeDropInProgress = false // this line is just a guess attempt really
			// it might throw all of the mechanics of everything off
			// or it might fix this small bug we're looking at
			// BUG FIXED
			return
		}
	}
}



function checkIfValidBlack(target) {

	const targetCoordinate = (target.getAttribute('coordinate')) || (target.parentNode.getAttribute('coordinate'))
	const piece = draggedElement.id
	const startRankId = Number(startRank)
	const targetRank = Number(target.getAttribute('rank-number')) || Number(target.parentNode.getAttribute('rank-number'))
	// const startFileLetter already defined in dragStart function
	const targetFileNum = Number(target.getAttribute('file-num')) || Number(target.parentNode.getAttribute('file-num'))
	// const startFileNum defined in dragStart function
	const startFileNum = Number(startFileNumId)

	switch(piece) {
		case 'pawn' :
			if (piece !== 'pawn') {
				break;
			}

			// new coordinate system movement

			// for black pieces just change equations to -1 instead of 1 for simplicity
			// and queening target rank is 1 instead of 8
			// and starting rank for two square move rule is 7 instead of 2
			// and queening attribute we set to black

			if ( // captured a piece to queen
					(Math.abs(targetFileNum - startFileNum) === 1) &&
					(targetRank - startRankId === -1) &&
					(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild) &&
					(targetRank === 1)
					) {
					queeningInProgress = true
					return true
				}
					
			else if (      // moved freely to queen
				((targetRank - startRankId) === -1)  &&
				(targetFileNum == startFileNum) &&
				!(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild) &&
				(targetRank === 1)
				) {
					queeningInProgress = true
					return true
			}
					
			else if ( // if pawn captures
				(Math.abs(targetFileNum - startFileNum) === 1) &&
				(targetRank - startRankId === -1) &&
				(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild)
				) {
				return true
			}
			
			else if (      // if pawn moves freely 1 square
				((targetRank - startRankId) === -1)  &&
				(targetFileNum == startFileNum) &&
			    !(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild)
			   ) {
				return true
			}
			
			else if (      // pawn moves 2 squares from start
				(startRankId === 7) &&
			   ((targetRank - startRankId) === -2)  &&
			   (targetFileNum == startFileNum) &&
			   !(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild) &&
			   !(document.querySelector(`[rank-number="${startRankId - 1}"][file-letter="${startFileLetter}"]`).firstChild)
			   		) {
				let allPawns = document.querySelectorAll('#pawn')
				allPawns.forEach(pawn => pawn.setAttribute('enpassent', false))
				// we will first querySelect every pawn enpassent attribute to false
				// then we will set this pawn attribute to true
				draggedElement.setAttribute('enpassent', true)
				return true
			}

			// ENPASSENT LOGIC HERE
			// capturing enpassent to right

			else if (
					(startRankId === 4) // enpassent capture can only happen for white from rank 5
					&& (targetRank - startRankId === -1) // this positive number indicates direction
					&& ((targetFileNum - startFileNum) === 1)
					// correct squares defined
					// AND IF pawn directly to left OR to right has enpassent true attribute
					&& (document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild?.getAttribute('enpassent') === 'true')
				    ) {

				enpassentInProgress = true
				return true
			}
			// capturing enpassent to left
			else if (
					(startRankId === 4) // enpassent capture can only happen for white from rank 5
					&& (targetRank - startRankId === -1) // this positive number indicates direction
					&& ((targetFileNum - startFileNum) === -1)
					// correct squares defined
					// AND IF pawn directly to left OR to right has enpassent true attribute
					&& (document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild?.getAttribute('enpassent') === 'true')
				    ) {
				enpassentInProgress = true
				return true
			}
			break;
		case 'knight' :
			if (piece !== 'knight') {
				break;
			}
			// 8 basic moves
			// for some reason, this only works if we assing variables first
			a = (Math.abs(targetFileNum - startFileNum))
			b = (Math.abs(targetRank - startRankId))

			// this covers 4 out of 8 squares
			if (
				(a == 2) &&
				(b == 1)
				) {
				return true
			}
			
			// this covers 4 out of 8 squares
			else if (
				(a == 1) &&
				(b == 2)
				) {
				return true
			}
			break;
		case 'bishop' :
			if (piece !== 'bishop') {
				break;
			}
			// attempt to cover 4 directions with each if statement
			// so this covers moving 1 square only
			// next do squares up to 7
			// same logic, AND if nothing exists in between the target
			// square and the bishop. No the bishop cannot jump nor teleport
			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)
			// we specify that this is a number for arithmetic
	
			if ( // this covers moving 1 square in every direction
				(a === 1) &&
				(b === 1)
				) {
				return true
			}
			
			// 2 SQUARES
			if ( // pos-x
				// pos-y
				// WE NEED to identify the direction the bishop is moving
				// we might be able to gather direction from the
				// target square - the start square
				// to define positive x-direction
				// target rank - starting rank will be POS
				// target file num - starting file num will be POS
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			// 3 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			// 4 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			// 5 SQUARES

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			

			// 6 SQUARES


			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			


			// 7 SQUARES 

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			break;
		case 'rook' :
			if (piece !== 'rook') {
				break;
			}

			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)

			// moving 1 square in any direction
			if (
				((a === 1) && (b === 0)) ||
				((a === 0) && (b === 1))
				) {
				return true
			}
			// horizontal movement
			// pos-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			// neg-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			// vertical movement
			// pos-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 3) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 4) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 5) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 6) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 7) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			// neg-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === -2) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -3) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -4) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -5) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -6) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -7) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			break;
		case 'queen':
			if (piece !== 'queen') {
				break;
			}
			// for this we will attempt to copy and paste rook + bishop code
			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)
			// we specify that this is a number for arithmetic
	
			if ( // this covers moving 1 square in every direction
				(a === 1) &&
				(b === 1)
				) {
				return true
			}
			
			// 2 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			// 3 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			// 4 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			// 5 SQUARES

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			

			// 6 SQUARES


			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			


			// 7 SQUARES 

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			// moving 1 square in any direction
			if (
				((a === 1) && (b === 0)) ||
				((a === 0) && (b === 1))
				) {
				return true
			}
			// horizontal movement
			// pos-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			// neg-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			// vertical movement
			// pos-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 3) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 4) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 5) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 6) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 7) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			// neg-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === -2) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -3) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -4) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -5) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -6) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -7) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			break;
		case 'king' :
			if (piece !== 'king') {
				break;
			}
			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)

			// castling logic goes here
			// IF king's attribute moved === 'false'
			// AND king side rook attribute moved === 'false'
			// AND target attribute is g1
			// AND f1 has no first child
			// AND g1 has no first child

			// TO-DO**

			// AND no opponent piece observes the squares inbetween
			// ex pass f1 and g1 through doesItObserve(f1)
			// and doesItObserve(g1)
			// which will return either true or false
			//

			// then king goes to g1, which will just return true, no special case needed
			// rook goes to f1
			// rook coordinate square under this specific case
			// will always be h1
			// h1.firstChild.remove()
			// f1.firstChild.append(rook)


			//  black king-side castle
			if(target.getAttribute('coordinate') === 'G8'
				&& draggedElement.getAttribute('moved') === 'false'
				// use query selector to select the element with coordinate h1
				// to target the rook piece attribute of moved
				&& document.querySelector(`[coordinate="H8"]`).firstChild?.getAttribute('moved') === 'false'
				// AND f1 and g1 are empty

				&& document.querySelector(`[coordinate="F8"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& document.querySelector(`[coordinate="G8"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& fakeDropInProgress === false
				&& !(whitePiecesRange.includes('F8'))
				&& !(whitePiecesRange.includes('G8'))
				&& !(whitePiecesRange.includes('E8'))


				) {
				// h1.firstChild.remove()
				// f1.firstChild.append(rook)
				// e.target.parentNode.append(draggedElement)
				// the target of the event is the piece, so grab
				// the parent node of the DROP, which is the square itself
				// and append the draggedElement
				// e.target.remove()
				let index = allBlackPiecesArray.indexOf(document.querySelector(`[coordinate="H8"]`).firstChild.firstChild)
				allBlackPiecesArray.splice(index, 1)
				document.querySelector(`[coordinate="H8"]`).firstChild.remove()
				document.querySelector(`[coordinate="F8"]`).innerHTML = rook
				document.querySelector(`[coordinate="F8"]`).firstChild.setAttribute('draggable', true)
				document.querySelector(`[coordinate="F8"]`).firstChild.firstChild.classList.add('black')

				allBlackPiecesArray.push(document.querySelector(`[coordinate="F8"]`).firstChild.firstChild)
				return true
			}

			// BLACK-queen-side castle
			if(target.getAttribute('coordinate') === 'C8'
				&& draggedElement.getAttribute('moved') === 'false'
				&& document.querySelector(`[coordinate="A8"]`).firstChild?.getAttribute('moved') === 'false'
				&& document.querySelector(`[coordinate="B8"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& document.querySelector(`[coordinate="C8"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& document.querySelector(`[coordinate="D8"]`).children.length === 0
				&& fakeDropInProgress === false
				&& !(whitePiecesRange.includes('B8'))
				&& !(whitePiecesRange.includes('C8'))
				&& !(whitePiecesRange.includes('D8'))
				&& !(whitePiecesRange.includes('E8'))
				) {
				let index = allBlackPiecesArray.indexOf(document.querySelector(`[coordinate="A8"]`).firstChild.firstChild)
				allBlackPiecesArray.splice(index, 1)
				document.querySelector(`[coordinate="A8"]`).firstChild.remove()
				document.querySelector(`[coordinate="D8"]`).innerHTML = rook
				document.querySelector(`[coordinate="D8"]`).firstChild.setAttribute('draggable', true)
				document.querySelector(`[coordinate="D8"]`).firstChild.firstChild.classList.add('black')

				allBlackPiecesArray.push(document.querySelector(`[coordinate="D8"]`).firstChild.firstChild)
				return true
			}
			if(
				(a < 2) &&
				(b < 2)
			  ) {
				return true
			}

	}
}



function checkIfValidWhite(target) {

	// new coordinate system movement
	// piece check list
	// !CHECK! - knight
	// !CHECK! - bishop
	// !CHECK! - rook
	// !CHECK! - queen
	// !CHECK! - auto-queening
	// !CHECK! - castling basics
	// !CHECK! - pawn basics
	// !CHECK! - enpassent
	// !CHECK! - no castling through check
	// !CHECK! - castling
	// !CHECK! - check detection



	const targetCoordinate = (target.getAttribute('coordinate')) || (target.parentNode.getAttribute('coordinate'))
	const piece = draggedElement.id
	const startRankId = Number(startRank)
	const targetRank = Number(target.getAttribute('rank-number')) || Number(target.parentNode.getAttribute('rank-number'))
	// const startFileLetter already defined in dragStart function
	const targetFileNum = Number(target.getAttribute('file-num')) || Number(target.parentNode.getAttribute('file-num'))
	// const startFileNum defined in dragStart function
	const startFileNum = Number(startFileNumId)


	switch(piece) {
		// so far pawn has just 3 cases
		// move 1 square
		// move 2 squares from start
		// capture diagonally
		// NEED TO ADD EN PASSENT
		// QUEENING WILL BE added as 3 separate cases
		// with a simple auto queen function first
		// then we will add the choice to choose a piece for queening
		case 'pawn' :
			if (piece !== 'pawn') { // not sure why this is happening
				// but this code fixes everything
				break;
			}
					// IF QUEENING
					// LOGIC BELOW
					// ALL SAME	exact case but if the target rank === 8
					// SUCCESS 
					// QUEENING WORKS


					// we test queening logic first
					// only 2 cases to queen
					// you move to back rank
					// or you capture to back rank
			if ( // pawn captures to queen
				(Math.abs(targetFileNum - startFileNum) === 1) &&
				(targetRank - startRankId === 1) &&
				(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild) &&
				(targetRank === 8)
				) {
					queeningInProgress = true
					return true
			}
					
			else if (      // pawn moves freely to queen
					((targetRank - startRankId) === 1)  &&
					(targetFileNum == startFileNum) && // we use double == because
					// startFileNum isn't a number, we didn't convert it
					// so double == will compare them just fine here
					!(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild) &&
					(targetRank === 8)
					) {
						queeningInProgress = true
						return true
			}
					

			// if target Coordinate is no less than 2 away
			// from start coordinate get attribute rank number
			// AND if nothing is in the way
			// if target rank is a difference of two from the starting rank
			// (which works with both black and white sides)
			// then make sure the element with (starting rank + 1)
			// and (startFileLetter) containes no firstChild
			// for example, if e2 to e4
			// simple code checks the target which is e4
			// now this will check e3 as well
			// by query searching for the element with
			// start rank + 1 AND start file letter
			// NOTE THIS ONLY APPLIES TO WHITES TURN
			// HAVE TO FIND A WAY TO APPLY DIFFERENT CODE 
			// DEPENDING ON WHOS TURN IT IS
			// !(document.querySelector(`[rank-number="${startRankId + 1}"][file-letter="${startFileLetter}"]`).firstChild)
			// this looks pretty good lets try
			// now find a way to call this function if it's white's turn
			// or else call a different function for black's turn
			// this will simply all the basic math
			// CHECK! 

			// if pawn captures diagonally NOT ENPASSENT
			else if (
				// if target file letter is 1 off the start file letter
				// and the target rank number is 1 MORE than the start rank
				// and the target square has a firstchild
				// capturing one's own pieces is defined else where. . .
				// we will simply this process by adding another
				// attribute of a numerical alphabet
				// A-H then becomes 1-8
				(Math.abs(targetFileNum - startFileNum) === 1) &&
				(targetRank - startRankId === 1) &&
				// so this covers moving backwards, only positive one
				// for the rank indicating forward direction
				(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild)
				) {
				return true
			}
			
			// if pawn moves 1 square forward
			else if (      
				((targetRank - startRankId) === 1)  &&
				(targetFileNum == startFileNum) && // we use double == because
				// startFileNum isn't a number, we didn't convert it
				// so double == will compare them just fine here
			    !(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild)
			   ) {
				return true
			}
			
			// if start pawn moves two squares on first move
			else if (      
				(startRankId === 2) &&
			   ((targetRank - startRankId) === 2)  &&
			   (targetFileNum == startFileNum) &&
			   !(document.querySelector(`[coordinate="${targetCoordinate}"]`).firstChild) &&
			   !(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum}"]`).firstChild)
			   		) {

				let allPawns = document.querySelectorAll('#pawn')
				allPawns.forEach(pawn => pawn.setAttribute('enpassent', false))
				// we will first querySelect every pawn enpassent attribute to false
				// then we will set this pawn attribute to true
				draggedElement.setAttribute('enpassent', true)
				return true
			}

			// ENPASSENT LOGIC HERE
			// capturing enpassent to right

			else if (
					(startRankId === 5) // enpassent capture can only happen for white from rank 5
					&& (targetRank - startRankId === 1) // this positive number indicates direction
					&& ((targetFileNum - startFileNum) === 1)
					// correct squares defined
					// AND IF pawn directly to left OR to right has enpassent true attribute
					&& (document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild?.getAttribute('enpassent') === 'true')
				    ) {

				enpassentInProgress = true
				return true
			}
			// capturing enpassent to left
			else if (
					(startRankId === 5) // enpassent capture can only happen for white from rank 5
					&& (targetRank - startRankId === 1) // this positive number indicates direction
					&& ((targetFileNum - startFileNum) === -1)
					// correct squares defined
					// AND IF pawn directly to left OR to right has enpassent true attribute
					&& (document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild?.getAttribute('enpassent') === 'true')
				    ) {
				enpassentInProgress = true
				return true
			}
			break;
			
			
			// NEXT TO DO
			//
			// CHECK! DONT ALLOW PAWNS TO MOVE BACKWARDS check!

			// !CHECK! queening

			// !CHECK! copy and refactor code for black pieces

			// en passent
			//
			// !CHECK!   pawn capturing logic
			// don't allow pawns to move diagonally otherwise
			// then pawns complete
			// !CHECK!

			// CHECK !   do this by adding another attribute of a
			// numerical alphabet

		case 'knight' :
			if (piece !== 'knight') {
				break;
			}
			// 8 basic moves
			// for some reason, this only works if we assign variables first
			a = (Math.abs(targetFileNum - startFileNum))
			b = (Math.abs(targetRank - startRankId))

			// this covers 4 out of 8 squares
			if (
				(a == 2) &&
				(b == 1)
				) {
				return true
			}
			
			// this covers 4 out of 8 squares
			else if (
				(a == 1) &&
				(b == 2)
				) {
				return true
			}
			break;

		case 'bishop' :
			if (piece !== 'bishop') {
				break;
			}
			// attempt to cover 4 directions with each if statement
			// so this covers moving 1 square only
			// next do squares up to 7
			// same logic, AND if nothing exists in between the target
			// square and the bishop. No the bishop cannot jump nor teleport
			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)
			// we specify that this is a number for arithmetic
	
			if ( // this covers moving 1 square in every direction
				(a === 1) &&
				(b === 1)
				) {
				return true
			}
			
			// 2 SQUARES
			if ( // pos-x
				// pos-y
				// WE NEED to identify the direction the bishop is moving
				// we might be able to gather direction from the
				// target square - the start square
				// to define positive x-direction
				// target rank - starting rank will be POS
				// target file num - starting file num will be POS
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			// 3 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			// 4 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			// 5 SQUARES

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			

			// 6 SQUARES


			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			


			// 7 SQUARES 

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			break;
		case 'rook' :
			if (piece !== 'rook') {
				break;
			}

			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)

			// moving 1 square in any direction
			if (
				((a === 1) && (b === 0)) ||
				((a === 0) && (b === 1))
				) {
				return true
			}
			// horizontal movement
			// pos-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			// neg-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			// vertical movement
			// pos-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 3) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 4) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 5) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 6) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 7) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			// neg-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === -2) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -3) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -4) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -5) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -6) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -7) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			break;
		case 'queen':
			if (piece !== 'queen') {
				break;
			}
			// for this we will attempt to copy and paste rook + bishop code
			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)
			// we specify that this is a number for arithmetic
	
			if ( // this covers moving 1 square in every direction
				(a === 1) &&
				(b === 1)
				) {
				return true
			}
			
			// 2 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -2) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			
			// 3 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -3) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			
			// 4 SQUARES
			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -4) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			
			// 5 SQUARES

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -5) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			

			// 6 SQUARES


			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -6) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			


			// 7 SQUARES 

			if ( // pos-x
				// pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // pos-y
				(targetRank - startRankId === 7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId + 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // neg-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			
			if ( // pos-x
				 // neg-y
				(targetRank - startRankId === -7) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId - 1}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 2}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 3}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 4}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 5}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId - 6}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			// moving 1 square in any direction
			if (
				((a === 1) && (b === 0)) ||
				((a === 0) && (b === 1))
				) {
				return true
			}
			// horizontal movement
			// pos-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === 7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum + 6}"]`).firstChild)
				) {
				return true
			}
			// neg-x direction
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -2) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -3) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -4) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -5) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -6) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild)
				) {
				return true
			}
			if (
				(a === 0) &&
				(targetFileNum - startFileNum === -7) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 1}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 2}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 3}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 4}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 5}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId}"][file-num="${startFileNum - 6}"]`).firstChild)
				) {
				return true
			}
			// vertical movement
			// pos-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === 2) &&
				!(document.querySelector(`[rank-number="${startRankId + 1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 3) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 4) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 5) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 6) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === 7) &&
				!(document.querySelector(`[rank-number="${startRankId+1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId+6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			// neg-y direction
			if (
				(b === 0) &&
				(targetRank - startRankId === -2) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -3) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -4) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -5) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -6) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			if (
				(b === 0) &&
				(targetRank - startRankId === -7) &&
				!(document.querySelector(`[rank-number="${startRankId-1}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-2}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-3}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-4}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-5}"][file-num="${startFileNum}"]`).firstChild) &&
				!(document.querySelector(`[rank-number="${startRankId-6}"][file-num="${startFileNum}"]`).firstChild)
				) {
				return true
			}
			break;
		case 'king' :

			a = Math.abs(targetRank - startRankId)
			b = Math.abs(targetFileNum - startFileNum)

			// castling logic goes here
			// IF king's attribute moved === 'false'
			// AND king side rook attribute moved === 'false'
			// AND target attribute is g1
			// AND f1 has no first child
			// AND g1 has no first child

			// TO-DO**

			// AND no opponent piece observes the squares inbetween
			// ex pass f1 and g1 through doesItObserve(f1)
			// and doesItObserve(g1)
			// which will return either true or false
			//

			// then king goes to g1, which will just return true, no special case needed
			// rook goes to f1
			// rook coordinate square under this specific case
			// will always be h1
			// h1.firstChild.remove()
			// f1.firstChild.append(rook)

			// white-king-side castle
			if(target.getAttribute('coordinate') === 'G1'
				&& draggedElement.getAttribute('moved') === 'false'
				// use query selector to select the element with coordinate h1
				// to target the rook piece attribute of moved
				&& document.querySelector(`[coordinate="H1"]`).firstChild?.getAttribute('moved') === 'false'
				// AND f1 and g1 are empty

				&& document.querySelector(`[coordinate="F1"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& document.querySelector(`[coordinate="G1"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& fakeDropInProgress === false
				&& !(blackPiecesRange.includes('F1'))
				&& !(blackPiecesRange.includes('G1'))
				&& !(blackPiecesRange.includes('E1'))


				) {
				// h1.firstChild.remove()
				// f1.firstChild.append(rook)
				// e.target.parentNode.append(draggedElement)
				// the target of the event is the piece, so grab
				// the parent node of the DROP, which is the square itself
				// and append the draggedElement
				// e.target.remove()
				let index = allWhitePiecesArray.indexOf(document.querySelector(`[coordinate="H1"]`).firstChild.firstChild)
				allWhitePiecesArray.splice(index, 1)
				document.querySelector(`[coordinate="H1"]`).firstChild.remove()
				document.querySelector(`[coordinate="F1"]`).innerHTML = rook
				document.querySelector(`[coordinate="F1"]`).firstChild.setAttribute('draggable', true)
				document.querySelector(`[coordinate="F1"]`).firstChild.firstChild.classList.add('white')

				allWhitePiecesArray.push(document.querySelector(`[coordinate="F1"]`).firstChild.firstChild)
				return true
			}

			// queen-side castle
			if(target.getAttribute('coordinate') === 'C1'
				&& draggedElement.getAttribute('moved') === 'false'
				&& document.querySelector(`[coordinate="A1"]`).firstChild?.getAttribute('moved') === 'false'
				&& document.querySelector(`[coordinate="B1"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& document.querySelector(`[coordinate="C1"]`).children.length === 0
				// AND the element with coordinate 'F1' does NOT have child nodes
				&& document.querySelector(`[coordinate="D1"]`).children.length === 0
				&& fakeDropInProgress === false
				// special bugged case above ^
				// castling wouldn't do anything for the piece range
				// so this works just fine

				// AND NO CASTLING THROUGH CHECK
				// HERE'S HOW WE DO IT
				// white queen-side castle
				// squares B1 C1 and D1 must NOT be in blackPiecesRange
				&& !(blackPiecesRange.includes('B1'))
				&& !(blackPiecesRange.includes('C1'))
				&& !(blackPiecesRange.includes('D1'))
				&& !(blackPiecesRange.includes('E1'))

				) {
				//
				let index = allWhitePiecesArray.indexOf(document.querySelector(`[coordinate="A1"]`).firstChild.firstChild)
				allWhitePiecesArray.splice(index, 1)
				document.querySelector(`[coordinate="A1"]`).firstChild.remove()
				document.querySelector(`[coordinate="D1"]`).innerHTML = rook
				document.querySelector(`[coordinate="D1"]`).firstChild.setAttribute('draggable', true)
				document.querySelector(`[coordinate="D1"]`).firstChild.firstChild.classList.add('white')
				// this removes the exisiting starting piece rook
				// from the allWhitePiecesArray
				// so we add it back in place of the starting rook
				allWhitePiecesArray.push(document.querySelector(`[coordinate="D1"]`).firstChild.firstChild)
				return true
			}

			if(
				(a < 2) &&
				(b < 2)
			  ) {
				return true
			}



	}
}


fakeDropInProgress = false // by default this will be false
var triggerDragAndDrop = function (selectorDrag, selectorDrop) {

		fakeDropInProgress = true

	// if this function is called, we know it's a fake drop

  // function for triggering mouse events
  var fireMouseEvent = function (type, elem, centerX, centerY) {
    var evt = document.createEvent('MouseEvents')
    evt.initMouseEvent(
      type,
      true,
      true,
      window,
      1,
      1,
      1,
      centerX,
      centerY,
      false,
      false,
      false,
      false,
      0,
      elem
    )
    elem.dispatchEvent(evt)
  }

  // fetch target elements
  // var elemDrag = document.querySelector(selectorDrag)
  // var elemDrop = document.querySelector(selectorDrop)
  var elemDrag = selectorDrag
  var elemDrop = selectorDrop

  if (!elemDrag || !elemDrop) return false

  // calculate positions
  var pos = elemDrag.parentNode.getBoundingClientRect()
  var center1X = Math.floor((pos.left + pos.right) / 2)
  var center1Y = Math.floor((pos.top + pos.bottom) / 2)
  pos = elemDrop.getBoundingClientRect()
  var center2X = Math.floor((pos.left + pos.right) / 2)
  var center2Y = Math.floor((pos.top + pos.bottom) / 2)

  // mouse over dragged element and mousedown
  fireMouseEvent('mousemove', elemDrag, center1X, center1Y)
  fireMouseEvent('mouseenter', elemDrag, center1X, center1Y)
  fireMouseEvent('mouseover', elemDrag, center1X, center1Y)
  fireMouseEvent('mousedown', elemDrag, center1X, center1Y)

  // start dragging process over to drop target
  fireMouseEvent('dragstart', elemDrag, center1X, center1Y)
  fireMouseEvent('drag', elemDrag, center1X, center1Y)
  fireMouseEvent('mousemove', elemDrag, center1X, center1Y)
  fireMouseEvent('drag', elemDrag, center2X, center2Y)
  fireMouseEvent('mousemove', elemDrop, center2X, center2Y)

  // trigger dragging process on top of drop target
  fireMouseEvent('mouseenter', elemDrop, center2X, center2Y)
  fireMouseEvent('dragenter', elemDrop, center2X, center2Y)
  fireMouseEvent('mouseover', elemDrop, center2X, center2Y)
  fireMouseEvent('dragover', elemDrop, center2X, center2Y)

  // release dragged element on top of drop target
  fireMouseEvent('drop', elemDrop, center2X, center2Y)
  fireMouseEvent('dragend', elemDrag, center2X, center2Y)
  fireMouseEvent('mouseup', elemDrag, center2X, center2Y)

  return true
}


// piece range squares logic for check,
// castling through check
// and mate
whitePiecesRange = []
const allWhitePieces = document.querySelectorAll('.white')
// convert this to an array to solve bugs
const len = allWhitePieces.length
const allWhitePiecesArray = Array(len)
for (i = 0;i < len; ++i) {
	allWhitePiecesArray[i] = allWhitePieces[i]
}


function updateWhitePiecesRange() {

	// after a move is validated within dragDrop function
	// call this one before dragDrop returns true

	whitePiecesRange = []
	// clear/ delete/ empty the array
	// set it to null or just an empty []
	// because every time this is called
	// meaning every time a piece is dropped
	// this array will change

	// use this document.querySelectorAll(".white")
	//const allWhitePieces = document.querySelectorAll(".white")
	// all white pieces will be assigned to this variable
	// which is actually a list, a Node list
	// which contains every white piece
	/*
	allWhitePieces.forEach((piece, i) => {
		// target the parent node of the piece
		// get that parent node's attribute of coordinate
		// add that specific coordinate string to this array
		onsole.log(piece.parentNode.parentNode.getAttribute('coordinate'))
		whitePiecesRange.push(piece.parentNode.parentNode.getAttribute('coordinate'))

			//********** NOW WE KNOW HOW TO PLAY AROUND WITH THESE THINGS
			//            NEXT -> WE WILL SIMULATE DRAG DROP 
			//     WITH EACH PIECE, TEST EVERY SQUARE
			//           IF THIS RETURNS TRUE, ADD that COORDINATE to whitePiecesRange
	})

	// for every piece with the class 'white'
	// run this piece through the same logic 
	// as the dragDrop function to artrifically
	// simulate the piece being dropped
	// at EVERY SQUARE ON THE BOARD
	// if any return valid and true, before returning
	// the value of true, add this square's coordinate
	// to the array

	// this will be a nested for loop
	// for each white piece {
	//     for each square on the board {
				// test the dragDrop move
				// validation logic
				// if that returns true
				// add the square at (i)
				// to the array
	//		}*/



	// NEW AND IMPROVED TARGETING FOR EACH PIECE
	// INSTEAD OF ASSUMING CERTAIN INDEX WILL BE A PAWN
	// WHICH IS NOT ALWAYS THE CASE
	// WE WILL TARGET PAWNS BY ATTRIBUTE INSTEAD
	for(i = 0; i < allWhitePiecesArray.length; ++i) {

		// if the attribute id is pawn
		if(allWhitePiecesArray[i].parentNode.getAttribute('id') === 'pawn') {
			// first we isolate each pawn's position square
		
		const fileNum = Number(allWhitePiecesArray[i].parentNode.parentNode.getAttribute('file-num'))
		const rankNum = Number(allWhitePiecesArray[i].parentNode.parentNode.getAttribute('rank-number'))
		// query select the square diagonally in front in both directions
		// add each one to the whitePieceRange array
		// this may throw an exception for pawns on the edge for example

		// this does, in fact, throw the exception
		// we will handle this manually, but I'm sure there's a more efficent way of going about this
		// since this is only two pawns, this will do

		if (fileNum === 1) {
			const tempRight = document.querySelector(`[rank-number="${rankNum + 1}"][file-num="${fileNum + 1}"]`)
			whitePiecesRange.push(tempRight.getAttribute('coordinate'))
			continue
		}
		if (fileNum === 8) {
			const tempLeft = document.querySelector(`[rank-number="${rankNum + 1}"][file-num="${fileNum - 1}"]`)
			whitePiecesRange.push(tempLeft.getAttribute('coordinate'))
			continue
		}

		const tempLeft = document.querySelector(`[rank-number="${rankNum + 1}"][file-num="${fileNum - 1}"]`)
		const tempRight = document.querySelector(`[rank-number="${rankNum + 1}"][file-num="${fileNum + 1}"]`)
		whitePiecesRange.push(tempLeft.getAttribute('coordinate'))
		whitePiecesRange.push(tempRight.getAttribute('coordinate'))
		}
		// if not a pawn
		else {
			for(j = 0; j < allSquares.length; ++j) {
				triggerDragAndDrop(allWhitePiecesArray[i].parentNode, allSquares[j])
			}
		}
	}
}


const allBlackPieces = document.querySelectorAll(".black")
// piece range squares logic for check,
// castling through check
// check and mate
const allBlackPiecesArray = Array(len)
for (i = 0;i < len; ++i) {
	allBlackPiecesArray[i] = allBlackPieces[i]
}

blackPiecesRange = []
function updateBlackPiecesRange() {

	blackPiecesRange = []

	for (i = 0; i < allBlackPiecesArray.length; ++i) {
		// for pawns
		if (allBlackPiecesArray[i].parentNode.getAttribute('id') === 'pawn') {
			const fileNum = Number(allBlackPiecesArray[i].parentNode.parentNode.getAttribute('file-num'))
			const rankNum = Number(allBlackPiecesArray[i].parentNode.parentNode.getAttribute('rank-number'))

			if (fileNum === 1) {
				const tempRight = document.querySelector(`[rank-number="${rankNum - 1}"][file-num="${fileNum + 1}"]`)
				blackPiecesRange.push(tempRight.getAttribute('coordinate'))
				continue
			}
			if (fileNum === 8) {
				const tempLeft = document.querySelector(`[rank-number="${rankNum - 1}"][file-num="${fileNum - 1}"]`)
				blackPiecesRange.push(tempLeft.getAttribute('coordinate'))
				continue
			}
			const tempLeft = document.querySelector(`[rank-number="${rankNum - 1}"][file-num="${fileNum - 1}"]`)
			const tempRight = document.querySelector(`[rank-number="${rankNum - 1}"][file-num="${fileNum + 1}"]`)
			blackPiecesRange.push(tempLeft.getAttribute('coordinate'))
			blackPiecesRange.push(tempRight.getAttribute('coordinate'))	
		}
		// every other piece on the board
		else {
			for(j = 0; j < allSquares.length; ++j) {
				triggerDragAndDrop(allBlackPiecesArray[i].parentNode, allSquares[j])
			}
		}
	}
}


function letsSeeIfYouAreInCheck() {

	// so after BLACK makes a move, this branch will execute
	if (playerGo === 'white') {

		// if it's white's go
		// we will see if white's king's square coordinate
		// is in blackPiecesRange
		
		let allKings = document.querySelectorAll('#king')
		let tempKingCoordinate

		if (allKings[0].firstChild.getAttribute('class') === 'black') {
			tempKingCoordinate = allKings[0].parentNode.getAttribute('coordinate')
		}
		if (allKings[1].firstChild.getAttribute('class') === 'black') {
			tempKingCoordinate = allKings[1].parentNode.getAttribute('coordinate')
		}
		updateWhitePiecesRange()
		changePlayer()
		
		if (whitePiecesRange.includes(tempKingCoordinate)) {
			movingPieceBackInProgress = true
			triggerDragAndDrop(lastMoveBuffer[0], lastMoveBuffer[1])
		}
		else {
			changePlayer()
		}
		// we need to drop the piece, so if this function is called
		// dragDrop will check if Valid and then drop the piece
		// by returning true from dragDrop
		// change player to black
		// change player again to white updates blackPiecesRange
		// 		AT THIS MOMENT if the king square is in the range of black pieces
		// move the piece back (this may be invalid move)
		// but we will add special case to allow it under dragDrop
		// without changing player
		// 		AT THE VERY NEXT MOMENT
		// 		if the king square is NO LONGER in the range of black pieces
		//      we return false
		//      and the player should change and everything function
		//      as it should

		// okay we're gonna try calling this function just before the return statement
		// of dragDrop
		// if playerGo = 'white' we updateWhiteRange
		// if playerGo = 'black' we updateBlackRange
		// our entire logic of this game is dependent on the right player
		// moving, that includes updating the range
		// if we update range out of turn, we find very funny errors
		//
		// supposing white moves, changeplayer() is called
		// the move is made and the range is updated
		// changeplayer() is called in dragDrop and does not
		// wait for the branch to execute before returning
		// the return statement
		//
		// so next we will call changeplayer() in this function
		// 2 times, to have the move dropped, black's go will updateblackRange,
		// then changeplayer() back to white's move

		// if at this point white's king is in black's range
		// we will move it back without changing player and it'll
		// still be white's turn

		// if at the same point white's king is NOT in black's range
		// we will pass the turn back over to black
		// and exit this function



		/*
		if (blackPiecesRange.includes(tempKingCoordinate)) {
			// if the white king is in the range of the black pieces
			// this is ONLY called if the suggested move is VALID
			// so now we must call updateBlackPiecesRange to see if
			// now the king's coordinate is in range

		}
		*/
	}

	// so after WHITE makes a move, this branch will execute
	if (playerGo === 'black') {

		// if it's black's go
		// we will see if black's king's square coordinate
		// is in whitePiecesRange
		// if it is, return true
		// if no, return false
		let allKings = document.querySelectorAll('#king')
		let tempKingCoordinate

		if (allKings[0].firstChild.getAttribute('class') === 'white') {
			tempKingCoordinate = allKings[0].parentNode.getAttribute('coordinate')
		}
		if (allKings[1].firstChild.getAttribute('class') === 'white') {
			tempKingCoordinate = allKings[1].parentNode.getAttribute('coordinate')
		}

		updateBlackPiecesRange() // after white makes a move we update black range
		// and pass the move back to white
		changePlayer()
		// now, is the white king in the range?
		if (blackPiecesRange.includes(tempKingCoordinate)) {

			// here it is WHITE'S TURN STILL
			// we must move the piece back without
			// changing player

			// so log the last move into a buffer position of some sort
			// flip a switch, a special switch to allow invalid moves
			// while still in correct turn
			// and simulate dragDrop it back, so hit the return
			// statement without changePlayer()
		
			// under that special branch we may call this function again

			movingPieceBackInProgress = true

			triggerDragAndDrop(lastMoveBuffer[0], lastMoveBuffer[1])
			
		}
		else {
			changePlayer()
		}
	}
}



function enpassentRule() {

	if (playerGo === "white") {
		// SET ALL BLACK PAWNS ENPASSENT TO FALSE HERE
		let allPawns = document.querySelectorAll('#pawn')
		for (i = 0;i < allPawns.length;++i) {
			if (allPawns[i].firstChild.getAttribute('class') === 'black') {
				allPawns[i].setAttribute('enpassent', false)
			}
		}
	} 
	else {
		// SET ALL WHITE PAWNS ENPASSENT TO FALSE HERE
		let allPawns = document.querySelectorAll('#pawn')
		for (i = 0;i < allPawns.length;++i) {
			if (allPawns[i].firstChild.getAttribute('class') === 'white') {
				allPawns[i].setAttribute('enpassent', false)
			}
		}
	}
}



function isItMate() {

	// calling order from dragDrop function is


	// changePlayer()
	//
	// if (mateDetectionInProgress === false) {
	//		isItMate()
	// }
	//
	// letsSeeIfYouAreInCheck()

	if (playerGo === 'white') {
		// so after black drops a piece
		// this executes

		// if white king is in black range immediately
		// as of this line
		// then we do something
		// if not, do nothing at all
		let allKings = document.querySelectorAll('#king')
		let tempKingCoordinate

		if (allKings[0].firstChild.getAttribute('class') === 'white') {
			tempKingCoordinate = allKings[0].parentNode.getAttribute('coordinate')
		}
		if (allKings[1].firstChild.getAttribute('class') === 'white') {
			tempKingCoordinate = allKings[1].parentNode.getAttribute('coordinate')
		}
		if (blackPiecesRange.includes(tempKingCoordinate)) {
		}
	}
	if (playerGo === 'black') {
		// and after white drops a piece
		// this executes

		// and if black king is in black range immediately
		// as of this line
		// then we do something
		// if not, do nothing at all

		let allKings = document.querySelectorAll('#king')
		let tempKingCoordinate

		if (allKings[0].firstChild.getAttribute('class') === 'black') {
			tempKingCoordinate = allKings[0].parentNode.getAttribute('coordinate')
		}
		if (allKings[1].firstChild.getAttribute('class') === 'black') {
			tempKingCoordinate = allKings[1].parentNode.getAttribute('coordinate')
		}
		if (whitePiecesRange.includes(tempKingCoordinate)) {
			// MATE LOGIC GOES HERE
		}
	}
}




function changePlayer() {
	if (playerGo === "white") {
		updateWhitePiecesRange()
		// if it's black's go, reverse the ids
		revertIds()
		playerGo = "black"
	} else {

		// if it's white's go, revertIds
		updateBlackPiecesRange()
		reverseIds()
		playerGo = "white"
	}
}

function reverseIds() {
	const allSquares = document.querySelectorAll(".square")
	allSquares.forEach((square, i) =>
		square.setAttribute('square-id', (width * width -1) -i))
}

function revertIds() {
	const allSquares = document.querySelectorAll(".square")
	allSquares.forEach((square, i) => square.setAttribute('square-id', i))
}

function gameOver() {


	// this will make everything undraggable
	// upon the conclusion of the game
	const allSquares = document.querySelectorAll('.square')
	allSquares.forEach(square => square.firstChild?.setAttribute('draggable', false))
}

function flipaBoard() {

	// for every piece of a color
	// add piece and add parent node coordinate to array
	
	let whiteParentPiecesArray = []
	// remove WHITE
	for (i = 0; i < allWhitePiecesArray.length; ++i) {
		let temp_coordinate = allWhitePiecesArray[i].parentNode.parentNode.getAttribute('coordinate')
		// temporarily store this SQUARE COORDINATE on the piece itself
		// then delete the temporary attribute
		// there we have it, solved
		whiteParentPiecesArray.push(allWhitePiecesArray[i].parentNode)
		allWhitePiecesArray[i].setAttribute('temp_coordinate', temp_coordinate)
		allWhitePiecesArray[i].parentNode.remove()
	}

	// remove BLACK
	let blackParentPiecesArray = []
	for (i = 0; i < allBlackPiecesArray.length; ++i) {
		let temp_coordinate = allBlackPiecesArray[i].parentNode.parentNode.getAttribute('coordinate')
		// temporarily store this SQUARE COORDINATE on the piece itself
		// then delete the temporary attribute
		// there we have it, solved
		blackParentPiecesArray.push(allBlackPiecesArray[i].parentNode)
		allBlackPiecesArray[i].setAttribute('temp_coordinate', temp_coordinate)
		allBlackPiecesArray[i].parentNode.remove()
	}

	// flip the COORDINATES of the squares
	// just have to INVERT THIS
	// OR flip back
	// THIS COMES OUT CORRECT, A1 BOTTOM LEFT, H8 TOP RIGHT
	// const chessAlphabet = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
	// const chessNumAlphabet = [8, 7, 6, 5, 4, 3, 2, 1]
	// SO JUST REVERSE ORDER THIS TO REVERT, IS IT REALLY THAT SIMPLE?
	// YES IT'S REALLY THAT SIMPLE


	const chessAlphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
	const chessNumAlphabet = [1, 2, 3, 4, 5, 6, 7, 8]
	const allSquares = document.querySelectorAll('.square')
	allSquares.forEach((square, i) => {
		const rankNumber = Math.floor(( (i) / 8) + 1)
		square.setAttribute('rank-number', rankNumber)
		const fileLetter = chessAlphabet.at((63 - i) % 8)
		square.setAttribute('file-letter', fileLetter)
		square.setAttribute('coordinate', fileLetter + rankNumber)
		// success
		const fileNum = chessNumAlphabet.at((63 - i) % 8)
		square.setAttribute('file-num', fileNum)
	})


	// append each piece at the saved coordinate
	// simple? simple 

	// add WHITE
	for (i = 0; i < allWhitePiecesArray.length; ++i) {
		let squareToAdd = allWhitePiecesArray[i].getAttribute('temp_coordinate')
		document.querySelector(`[coordinate="${squareToAdd}"]`).append(whiteParentPiecesArray[i])
		allWhitePiecesArray[i].removeAttribute('temp_coordinate')
	}

	// add BLACK
	for (i = 0; i < allBlackPiecesArray.length; ++i) {
		let squareToAdd = allBlackPiecesArray[i].getAttribute('temp_coordinate')
		document.querySelector(`[coordinate="${squareToAdd}"]`).append(blackParentPiecesArray[i])
		allBlackPiecesArray[i].removeAttribute('temp_coordinate')
	}

}
function flipToOG() {



	let whiteParentPiecesArray = []
	// remove WHITE
	for (i = 0; i < allWhitePiecesArray.length; ++i) {
		let temp_coordinate = allWhitePiecesArray[i].parentNode.parentNode.getAttribute('coordinate')
		// temporarily store this SQUARE COORDINATE on the piece itself
		// then delete the temporary attribute
		// there we have it, solved
		whiteParentPiecesArray.push(allWhitePiecesArray[i].parentNode)
		allWhitePiecesArray[i].setAttribute('temp_coordinate', temp_coordinate)
		allWhitePiecesArray[i].parentNode.remove()
	}

	// remove BLACK
	let blackParentPiecesArray = []
	for (i = 0; i < allBlackPiecesArray.length; ++i) {
		let temp_coordinate = allBlackPiecesArray[i].parentNode.parentNode.getAttribute('coordinate')
		// temporarily store this SQUARE COORDINATE on the piece itself
		// then delete the temporary attribute
		// there we have it, solved
		blackParentPiecesArray.push(allBlackPiecesArray[i].parentNode)
		allBlackPiecesArray[i].setAttribute('temp_coordinate', temp_coordinate)
		allBlackPiecesArray[i].parentNode.remove()
	}


	const chessAlphabet = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
	const chessNumAlphabet = [8, 7, 6, 5, 4, 3, 2, 1]
	const allSquares = document.querySelectorAll('.square')
	allSquares.forEach((square, i) => {
		const rankNumber = Math.floor(( (63 - i) / 8) + 1)
		square.setAttribute('rank-number', rankNumber)
		const fileLetter = chessAlphabet.at((63 - i) % 8)
		square.setAttribute('file-letter', fileLetter)
		square.setAttribute('coordinate', fileLetter + rankNumber)
		// success
		const fileNum = chessNumAlphabet.at((63 - i) % 8)
		square.setAttribute('file-num', fileNum)
	})

	// add WHITE
	for (i = 0; i < allWhitePiecesArray.length; ++i) {
		let squareToAdd = allWhitePiecesArray[i].getAttribute('temp_coordinate')
		document.querySelector(`[coordinate="${squareToAdd}"]`).append(whiteParentPiecesArray[i])
		allWhitePiecesArray[i].removeAttribute('temp_coordinate')
	}

	// add BLACK
	for (i = 0; i < allBlackPiecesArray.length; ++i) {
		let squareToAdd = allBlackPiecesArray[i].getAttribute('temp_coordinate')
		document.querySelector(`[coordinate="${squareToAdd}"]`).append(blackParentPiecesArray[i])
		allBlackPiecesArray[i].removeAttribute('temp_coordinate')
	}

}

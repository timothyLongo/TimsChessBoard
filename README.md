# TimsChessBoard
Chess (javascript)

https://timschessboard.000webhostapp.com/

// MANY THANKS GOES TO 'CODE WITH ANIA KUBOW'

// https://www.youtube.com/watch?v=Qv0fvm5B0EM&list=PL4ntBt81cc8VDhQ7yZFdxS09CLNLhY5D7&index=1

// FOR LAYING THE FOUNDATION AND INSPIRING ME TO COMPLETE

// THIS PROJECT

// AND THE DRAG-DROP-SIMULATOR GUY

// https://ghostinspector.com/blog/simulate-drag-and-drop-javascript-casperjs/

// BELOW IS WHAT I'VE DONE TO COMPLETE THIS PROJECT

// ALL FUNNY JUMPING MOVES ARE FIXED -- (new coordinate system is responsible for this)

// EVERY LEGAL MOVE VALIDATED -- (enpassent, castling rights, no castling through check, queening etc.)

// CHECK DETECTION AND VALIDATION -- (not only is check detected, but one may not PUT oneself in check)

// I accomplished this by adding a 'range' for each color

// in each 'range' array is every coordinate that every piece of that color observes

// if the king's coordinate square is in the opponents range, then we have check

// What I wish I had accomplished:

// : Mate detection

// : Queening piece selection

// : Move log with buttons to replay through the moves

window._tileSize = 48;
window._horizontalTiles = 15;
window._verticalTiles = 10;

var Canvas = this.__canvas = new fabric.Canvas(
    'canvas',
    {
        hoverCursor: 'pointer',
        selection: false
    }
);

var Sound = {
    playMove: function() {
        var sound = new Audio('move.wav');
        sound.play();
    }
};

var Logger = {
    log: function(message) {
        if (console !== undefined && console.log !== undefined) {
            console.log(message);
        }
    }
};

var Game = function() {

    var tileSize = window._tileSize;
    var horizontalTiles = window._horizontalTiles;
    var verticalTiles = window._verticalTiles;
    var board = new Board(horizontalTiles, verticalTiles, tileSize);

    var currentPiece = null;

    self = this;

    document.getElementById('container').style.width = (horizontalTiles * tileSize) + 1 + 'px';
    document.getElementById('container').style.height = (verticalTiles * tileSize) + 1 + 'px';

    Canvas.setDimensions({
        width: (horizontalTiles * tileSize) + 1,
        height: (verticalTiles * tileSize) + 1
    });

    this.getBoard = function() {
        return board;
    }

    this.setCurrentPiece = function(row, column) {
        currentPiece = self.getBoard().getPiece(row, column);
    };

    this.getCurrentPiece = function() {
        return currentPiece;
    };

    Canvas.on(
        {
            'mouse:down': function(options) {

                window._mouseBeginningX = options.e.offsetX;
                window._mouseBeginningY = options.e.offsetY;

                self.setCurrentPiece(
                    self.getBoard().getRowAt(options.e.offsetY),
                    self.getBoard().getColumnAt(options.e.offsetX)
                );

                //Logger.log('clicou ' + self.getBoard().getRowAt(options.e.offsetY) + ':' + self.getBoard().getColumnAt(options.e.offsetX));
            },
            'mouse:up': function(options) {

                var board = self.getBoard();
                var movedPiece = self.getCurrentPiece();

                var oldRow = movedPiece.getRow();
                var oldColumn = movedPiece.getColumn();

                var mouseRow = board.getRowAt(options.e.offsetY);
                var mouseColumn = board.getColumnAt(options.e.offsetX);

                //Logger.log('soltou ' + mouseRow + ':' + mouseColumn);

                // Moved outside board
                if (!board.checkPosition(mouseRow, mouseColumn)) {

                    return Logger.log('moveu pra fora');
                    // @TODO play "failure" sound
                }

                // Moved mouse outside initial place
                if (mouseRow == oldRow && mouseColumn == oldColumn) {
                    return Logger.log('posicao do mouse nao mudou');
                }

                var newRow = oldRow;
                var newColumn = oldColumn;

                // Limit row movement to 1 position
                // diagonal become either up or down
                if (mouseRow < oldRow) {
                    newRow--;
                } else if (mouseRow > oldRow) {
                    newRow++;
                } else if (mouseColumn > oldColumn) {
                    newColumn++;
                } else {
                    newColumn--;
                }

                // If it explodes the board limit, does nothing
                var firstRow = 0;
                var firstColumn = 0;
                var lastRow = board.getLastRow();
                var lastColumn = board.getLastColumn();

                if (!board.checkPosition(newRow, newColumn)) {

                    return Logger.log('calculou pra fora');
                    // @TODO play "failure" sound
                }

                if (newRow == oldRow && newColumn == oldColumn) {
                    return Logger.log('posicao da peca nao mudou');
                }

                var replacedPiece = self.getBoard().getPiece(newRow, newColumn);

                board.move(movedPiece, replacedPiece);

                Logger.log('moveu de ' + oldRow + ':' + oldColumn + ' pra ' + newRow + ':' + newColumn);

                board.removeMatches();

                // Play sound
                Sound.playMove();
            }
        }
    );
};

var Piece = function(_board, _row, _column) {

    var self = this;

    var types = {
        1: '#FF0000', // vermelho
        2: '#0000FF', // azul
        3: '#00FF00', // verde
        4: '#FFFF00', // amarelo
        5: '#FFCC00', // laranja
        6: '#FF00FF', // roxo
    };

    this.type = Math.floor(Math.random() * 6) + 1;

    var color = this.color = types[this.type];
    var board = _board;

    this.row = _row;
    this.column = _column;
    this.locked = false;
    this.doll = self.doll = new fabric.Circle({
        top: (self.row * board.tileSize) + 1,
        left: (self.column * board.tileSize) + 1,
        radius: (board.tileSize/2) - 1,
        fill: color,
        selectable: false
    });

    this.getRow = function() {
        return self.row;
    };

    this.getColumn = function() {
        return self.column;
    };

    this.move = function(newRow, newColumn) {

        self.getDoll().set({
            left: 1 + (newColumn * window._tileSize),
            top: 1 + (newRow * window._tileSize)
        });
        self.getDoll().bringToFront();
        self.row = newRow;
        self.column = newColumn;
    };

    this.getDoll = function() {
        return self.doll;
    };

    this.destroy = function() {
        // @TODO play sound and explosion animation
        // @TODO drop new pieces
        return Canvas.remove(self.doll);
    };
};

var Board = function(width, height, tileSize) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.pieces = [];

    var self = this;

    for (var row = 0; row < height; row++) {

        var rowPieces = [];

        for (var column = 0; column < width; column++) {

            var piece = new Piece(this, row, column);
            var top = row * tileSize;
            var left = column * tileSize;

            // Add piece
            rowPieces.push(piece);

            Canvas.add(
                // Draw cell
                new fabric.Rect({
                    top: top,
                    left: left,
                    width: tileSize,
                    height: tileSize,
                    fill: 'transparent',
                    stroke: '#000',
                    selectable: false
                })
            );

            Canvas.add(
                // Draw piece
                piece.getDoll()
            );
        }

        this.pieces.push(rowPieces);
    }

    this.getPiece = function(row, column) {
        return self.pieces[row][column];
    };

    this.getRowAt = function(top) {
        return Math.floor(top / window._tileSize);
    };

    this.getColumnAt = function(left) {
        return Math.floor(left / window._tileSize);
    };

    this.getLastRow = function() {
        return window._verticalTiles - 1;
    };

    this.getLastColumn = function() {
        return window._horizontalTiles - 1;
    };

    this.removeMatches = function() {

        var repeatedPieces = {};

        // Horizontal matches
        for (var row in self.pieces) {

            var previousColor = null;
            var repeatedColor = 1;

            for (var column in self.pieces[row]) {

                var current = self.pieces[row][column];

                if (previousColor === current.color) {
                    repeatedColor++;
                } else {
                    repeatedColor = 1;
                    previousColor = current.color;
                }

                if (repeatedColor > 3) {
                    repeatedPieces[row + ':' + column] = current;
                } else if (repeatedColor == 3) {
                    repeatedPieces[row + ':' + column] = current;
                    repeatedPieces[row + ':' + (column-1)] = self.pieces[row][column-1];
                    repeatedPieces[row + ':' + (column-2)] = self.pieces[row][column-2];
                }
            }
        }

        // Vertical matches
        for (var column = 0; column < window._horizontalTiles; column++) {

            var previousColor = null;
            var repeatedColor = 1;

            for (var row = 0; row < window._verticalTiles; row++) {

                var current = self.pieces[row][column];

                if (previousColor === current.color) {
                    repeatedColor++;
                } else {
                    repeatedColor = 1;
                    previousColor = current.color;
                }

                if (repeatedColor > 3) {
                    repeatedPieces[row + ':' + column] = current;
                } else if (repeatedColor == 3) {
                    repeatedPieces[row + ':' + column] = current;
                    repeatedPieces[(row-1) + ':' + column] = self.pieces[row-1][column];
                    repeatedPieces[(row-2) + ':' + column] = self.pieces[row-2][column];
                }
            }
        }

        console.log(repeatedPieces);

        // Eliminate pieces
        for (var k in repeatedPieces) {
            repeatedPieces[k].destroy();
        }
    };

    this.move = function(piece1, piece2) {

        var oldRow    = piece1.row;
        var oldColumn = piece1.column;

        var newRow    = piece2.row;
        var newColumn = piece2.column;

        self.pieces[oldRow][oldColumn] = piece2;
        self.pieces[newRow][newColumn] = piece1;

        piece1.move(newRow, newColumn);
        piece2.move(oldRow, oldColumn);
    };

    this.checkPosition = function(newRow, newColumn) {
        var firstRow = 0;
        var firstColumn = 0;
        var lastRow = self.getLastRow();
        var lastColumn = self.getLastColumn();

        if (
            newRow < firstRow
            || newRow > lastRow
            || newColumn < firstColumn
            || newColumn > lastColumn
            ) {

            return false;
        } else {
            return true;
        }
    };
};

new Game();
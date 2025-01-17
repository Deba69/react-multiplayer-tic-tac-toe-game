import { useState, useEffect } from "react";
import Board from "./board";
import GameOver from "./gameover";
import GameState from "./gamestate";
import Reset from "./reset";
import io from "socket.io-client";

const socket = io.connect("https://react-multiplayer-tic-tac-toe-game.onrender.com");

const PLAYER_X = "X";
const PLAYER_O = "O";

const winningCombinations = [
  { combo: [0, 1, 2], strikeClass: "strike-row-1" },
  { combo: [3, 4, 5], strikeClass: "strike-row-2" },
  { combo: [6, 7, 8], strikeClass: "strike-row-3" },
  { combo: [0, 3, 6], strikeClass: "strike-column-1" },
  { combo: [1, 4, 7], strikeClass: "strike-column-2" },
  { combo: [2, 5, 8], strikeClass: "strike-column-3" },
  { combo: [0, 4, 8], strikeClass: "strike-diagonal-1" },
  { combo: [2, 4, 6], strikeClass: "strike-diagonal-2" },
];

function checkWinner(tiles, setStrikeClass, setGameState) {
  for (const { combo, strikeClass } of winningCombinations) {
    const [a, b, c] = combo;
    if (tiles[a] && tiles[a] === tiles[b] && tiles[a] === tiles[c]) {
      setStrikeClass(strikeClass);
      setGameState(tiles[a] === PLAYER_X ? GameState.playerXWins : GameState.playerOWins);
      return;
    }
  }

  if (tiles.every((tile) => tile !== null)) {
    setGameState(GameState.draw);
  }
}

function TicTacToe() {
  const [tiles, setTiles] = useState(Array(9).fill(null));
  const [player, setPlayer] = useState(null); 
  const [playerTurn, setPlayerTurn] = useState(PLAYER_X);
  const [strikeClass, setStrikeClass] = useState();
  const [gameState, setGameState] = useState(GameState.inProgress);
  const [room, setRoom] = useState(""); 
  const [joined, setJoined] = useState(false); 

  const joinRoom = () => {
    if (room.trim() !== "") {
      socket.emit("join_room", room);
      setJoined(true);
    }
  };

  useEffect(() => {
    socket.on("assignPlayer", (assignedPlayer) => {
      setPlayer(assignedPlayer);
    });

    socket.on("updateBoard", (data) => {
      setTiles(data.tiles);
      setPlayerTurn(data.playerTurn);
      setStrikeClass(data.strikeClass); 
    });

    return () => {
      socket.off("assignPlayer");
      socket.off("updateBoard");
    };
  }, []);

  const handleTileClick = (index) => {
    if (gameState !== GameState.inProgress || tiles[index] !== null || player !== playerTurn) {
      return;
    }
    socket.emit("make_move", { index, room });
  };

  const handleReset = () => {
    socket.emit("reset_game", room);
    setGameState(GameState.inProgress);
    setTiles(Array(9).fill(null));
    setPlayerTurn(PLAYER_X);
    setStrikeClass(null);
  };

  useEffect(() => {
    checkWinner(tiles, setStrikeClass, setGameState);
  }, [tiles]);

  return (
    <div className="box">
      <h1>Tic Tac Toe</h1>
  
      {!joined ? (
        <div className="room-container">
          <input
            type="text"
            placeholder="Enter Room Code"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room / create Room</button>
        </div>
      ) : (
        <>
          <div className="room-info">
            <p>Room: <strong>{room}</strong></p>
            <p>You are: <strong>{player}</strong></p>
          </div>
          <Board playerTurn={playerTurn} tiles={tiles} onTileClick={handleTileClick} strikeClass={strikeClass} />
          <GameOver gameState={gameState} />
          <Reset gameState={gameState} onReset={handleReset} />
        </>
      )}
    </div>
  );
}

export default TicTacToe;

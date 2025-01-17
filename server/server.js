const io = require("socket.io")(3000, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });
  
  const rooms = {}; 
  
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
  
    socket.on("join_room", (room) => {
      if (!rooms[room]) {
        rooms[room] = { players: {}, tiles: Array(9).fill(null), playerTurn: "X" };
      }
  
      const roomData = rooms[room];
  
      if (!roomData.players.X) {
        roomData.players.X = socket.id;
        socket.emit("assignPlayer", "X");
      } else if (!roomData.players.O) {
        roomData.players.O = socket.id;
        socket.emit("assignPlayer", "O");
      } else {
        socket.emit("assignPlayer", "Spectator");
      }
  
      socket.join(room);
      socket.emit("updateBoard", { tiles: roomData.tiles, playerTurn: roomData.playerTurn });
    });
  
    socket.on("make_move", ({ index, room }) => {
      if (!rooms[room] || rooms[room].tiles[index] !== null) return;
  
      const roomData = rooms[room];
      roomData.tiles[index] = roomData.playerTurn;
      roomData.playerTurn = roomData.playerTurn === "X" ? "O" : "X";
  
      io.to(room).emit("updateBoard", { tiles: roomData.tiles, playerTurn: roomData.playerTurn });
    });
  
    socket.on("reset_game", (room) => {
        if (!rooms[room]) return;
        
        rooms[room].tiles = Array(9).fill(null);
        rooms[room].playerTurn = "X";
        rooms[room].strikeClass = null; 
      
        io.to(room).emit("updateBoard", {
          tiles: rooms[room].tiles,
          playerTurn: rooms[room].playerTurn,
          strikeClass: rooms[room].strikeClass,
        });
      });
  
    socket.on("disconnect", () => {
      for (const room in rooms) {
        if (rooms[room].players.X === socket.id) {
          delete rooms[room].players.X;
        } else if (rooms[room].players.O === socket.id) {
          delete rooms[room].players.O;
        }   
  
        if (Object.keys(rooms[room].players).length === 0) {
          delete rooms[room];
        }
      }
  
      console.log("A user disconnected:", socket.id);
    });
  });
  
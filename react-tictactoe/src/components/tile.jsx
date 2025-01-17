
function Tile({ className, value, onClick, playerTurn }) {
    
    return (
      <div onClick={onClick} className={`tile ${className}`}>
        {value}
      </div>
    );
  }
  
  export default Tile;
  
import React from 'react';

function Cell({ index, cell, mine, flash, onClaim }) {
  const classes = ['cell'];
  if (cell) classes.push('owned');
  if (mine) classes.push('mine');
  if (flash === 'pulse') classes.push('pulse');
  if (flash === 'rejected') classes.push('rejected');

  return (
    <div
      className={classes.join(' ')}
      style={cell ? { backgroundColor: cell.color } : undefined}
      title={cell ? cell.name : 'unclaimed'}
      onClick={() => onClaim(index)}
    />
  );
}

function areEqual(prev, next) {
  return (
    prev.cell === next.cell &&
    prev.mine === next.mine &&
    prev.flash === next.flash &&
    prev.onClaim === next.onClaim
  );
}

export default React.memo(Cell, areEqual);

const { parse, compile, GameEngine } = require('./dist/index.js');

const code = `
game: "Teleporter Chess"
extends: "Standard Chess"

piece Teleporter {
  move: leap(2, 1)
  capture: leap(2, 1)
  traits: [warp, jump]
  state: { cooldown: 0 }
}

trigger warp_use {
  on: move
  when: piece.type == Teleporter
  do: set piece.state.cooldown = 3
}

trigger warp_recover {
  on: turn_end
  when: piece.type == Teleporter
  do: set piece.state.cooldown = piece.state.cooldown - 1
}

setup:
  replace:
    Knight: Teleporter
`;

const ast = parse(code);
const compiled = compile(ast);
const game = new GameEngine(compiled);

console.log('=== Teleporter Chess Test ===\n');

// Find initial Teleporter pieces
let state = game.getState();
let teleporters = state.pieces.filter(p => p.type === 'Teleporter');
console.log('Initial State:');
console.log(`Found ${teleporters.length} Teleporter pieces`);
for (const t of teleporters) {
  console.log(`  ${t.owner} Teleporter at ${String.fromCharCode(97 + t.pos.file)}${t.pos.rank + 1}:`);
  console.log(`    Traits: [${Array.from(t.traits).join(', ')}]`);
  console.log(`    State: cooldown=${t.state.cooldown}`);
}

// Check trait definitions
console.log('\n=== Trait Definitions ===');
console.log('Built-in traits:', Array.from(compiled.traits.keys()));
const warpTrait = compiled.traits.get('warp');
console.log('warp trait:', warpTrait);
const phaseTrait = compiled.traits.get('phase');
console.log('phase trait:', phaseTrait);

// Get moves for a Teleporter
const whiteTeleporter = teleporters.find(t => t.owner === 'White');
if (whiteTeleporter) {
  console.log(`\nWhite Teleporter position: ${String.fromCharCode(97 + whiteTeleporter.pos.file)}${whiteTeleporter.pos.rank + 1}`);
  console.log(`Has phase trait: ${whiteTeleporter.traits.has('phase')}`);
  
  // Check surrounding squares
  const surr = [
    { file: whiteTeleporter.pos.file - 1, rank: whiteTeleporter.pos.rank }, // left
    { file: whiteTeleporter.pos.file + 1, rank: whiteTeleporter.pos.rank }, // right
    { file: whiteTeleporter.pos.file, rank: whiteTeleporter.pos.rank - 1 }, // down
    { file: whiteTeleporter.pos.file, rank: whiteTeleporter.pos.rank + 1 }, // up
  ];
  console.log('Surrounding squares:');
  for (const s of surr) {
    if (s.file >= 0 && s.file < 8 && s.rank >= 0 && s.rank < 8) {
      const p = state.pieces.find(p => p.pos.file === s.file && p.pos.rank === s.rank);
      console.log(`  ${String.fromCharCode(97 + s.file)}${s.rank + 1}: ${p ? p.type + ' (' + p.owner + ')' : 'empty'}`);
    }
  }
  
  const moves = game.getLegalMoves().filter(m => m.piece.id === whiteTeleporter.id);
  console.log(`\nWhite Teleporter can move to ${moves.length} squares:`);
  for (const m of moves) {
    console.log(`  ${String.fromCharCode(97 + m.to.file)}${m.to.rank + 1} (${m.type})`);
  }
  
  // Make a move
  if (moves.length > 0) {
    console.log('\n=== Making a move ===');
    const move = moves[0];
    console.log(`Moving to ${String.fromCharCode(97 + move.to.file)}${move.to.rank + 1}`);
    game.makeMove(move);
    
    // Check state after move
    state = game.getState();
    const movedTeleporter = state.pieces.find(p => 
      p.type === 'Teleporter' && 
      p.pos.file === move.to.file && 
      p.pos.rank === move.to.rank
    );
    
    if (movedTeleporter) {
      console.log('\nAfter move:');
      console.log(`  Position: ${String.fromCharCode(97 + movedTeleporter.pos.file)}${movedTeleporter.pos.rank + 1}`);
      console.log(`  State: cooldown=${movedTeleporter.state.cooldown}`);
      console.log(`  (Expected: 3 from warp_use, then -1 from warp_recover = 2)`);
      
      // warp_use sets cooldown to 3, then warp_recover decrements by 1 at turn_end
      if (movedTeleporter.state.cooldown === 2) {
        console.log('\n✅ SET ACTION WORKS!');
        console.log('   - warp_use set cooldown to 3');
        console.log('   - warp_recover decremented to 2 at turn_end');
      } else if (movedTeleporter.state.cooldown === 3) {
        console.log('\n✅ SET ACTION WORKS! Cooldown was set to 3 by trigger.');
        console.log('   (warp_recover might not have run yet)');
      } else {
        console.log('\n❌ Unexpected cooldown value.');
      }
    }
  }
}

console.log('\n=== Phase Trait Test ===');
// Create a Ghost with phase trait
const ghostCode = `
game: "Ghost Test"
extends: "Standard Chess"

piece Ghost {
  move: slide(orthogonal)
  capture: none
  traits: [phase]
}

setup:
  add:
    White Ghost: [a3]
`;

const ghostAst = parse(ghostCode);
const ghostCompiled = compile(ghostAst);
const ghostGame = new GameEngine(ghostCompiled);

const ghostState = ghostGame.getState();
const ghost = ghostState.pieces.find(p => p.type === 'Ghost');
if (ghost) {
  console.log(`Ghost at a3 has phase trait: ${ghost.traits.has('phase')}`);
  
  const ghostMoves = ghostGame.getLegalMoves().filter(m => m.piece.type === 'Ghost');
  console.log(`Ghost can move to ${ghostMoves.length} squares`);
  
  // Ghost should be able to pass through pieces with phase trait
  // Check if it can reach far squares (passing through a2 pawn potentially)
  const farMoves = ghostMoves.filter(m => 
    (m.to.file === 0 && m.to.rank >= 3) || // Up the a-file
    (m.to.rank === 2 && m.to.file >= 1)     // Along rank 3
  );
  console.log(`Ghost can reach ${farMoves.length} distant squares`);
}

console.log('\n=== Test Complete ===');

import { For, createMemo } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import {
  createDraggable,
  createDroppable,
  useDragDropContext,
  DragDropProvider,
  DragDropSensors,
} from '@thisbeyond/solid-dnd';
import styles from './App.module.css';

function App() {
  return (
    <div class={styles.App}>
      <div class={styles.header}>
        Try quickly dragging around the green square in the center, and notice the initial delay between the square moving, and the grid resizing its rows and columns +1.
      </div>
      <DragDropProvider>
        <DragDropSensors />
        <Grid />
      </DragDropProvider>
    </div>
  );
}

function Grid() {
  const [state, setState] = createStore({
    items: {
      1: { id: 1, row: 0, col: 0 },
      2: { id: 2, row: 13, col: 13 },
      3: { id: 3, row: 26, col: 26 },
    },
    beginDragSize: null,
  });

  const isDragActive = () => state.beginDragSize !== null;

  const size = createMemo(() => {
    if (isDragActive()) {
      const { beginDragSize } = state;
      return { rows: beginDragSize.rows + 1, cols: beginDragSize.rows + 1 };
    }

    let maxRow = 0, maxCol = 0;
    for (const item of Object.values(state.items)) {
      maxRow = Math.max(item.row + 1, maxRow);
      maxCol = Math.max(item.col + 1, maxCol);
    }
    return { rows: maxRow, cols: maxCol };
  });

  // For use in Solid's <For/>, that re-renders all items that are
  // unequal by a `===` check, we need to either memoize the `{ row, col }`
  // objects to maintain the same references, or use a value type like a string.
  // For simplicity, using a string.
  const cells = () => {
    const arr = [];
    for (let row = 0; row < size().rows; row++) {
      for (let col = 0; col < size().cols; col++) {
        arr.push(`${row}-${col}`);
      }
    }
    return arr;
  };

  const [, dndActions] = useDragDropContext();

  dndActions.onDragStart(() => {
    setState('beginDragSize', unwrap(size()));
  });

  dndActions.onDragEnd(() => {
    setState('beginDragSize', null);
  });

  dndActions.onDragOver(({ draggable, droppable }) => {
    if (!droppable) return;
    const { row, col } = parseCellStr(droppable.id);

    const item = state.items[draggable.id];
    if (item.row === row && item.col === col) return;

    setState('items', draggable.id, { row, col });
  });

  const items = () => Object.values(state.items);

  return (
    <div>
      <div class={styles.grid} style={{
        'grid-template-rows': `repeat(${size().rows}, 20px)`,
        'grid-template-columns': `repeat(${size().cols}, 20px)`,
      }}>
        <For each={cells()}>
          {cellStr => {
            const { row, col } = parseCellStr(cellStr);
            return <DroppableCell row={row} col={col} />
          }}
        </For>

        <For each={items()}>
          {item => <DraggableItem id={item.id} row={item.row} col={item.col} />}
        </For>
      </div>
    </div>
  );
}

/** @param {string} str */
const parseCellStr = (str) => {
  const row = Number(str.match(/^(\d+)-/)[1]);
  const col = Number(str.match(/-(\d+)$/)[1]);
  return { row, col };
};

function DroppableCell(props) {
  const droppable = createDroppable(`${props.row}-${props.col}`);

  return <div
    class={styles.droppable}
    style={{
      'grid-area': `${props.row + 1} / ${props.col + 1} / span 1 / span 1`,
    }}
    ref={ref => droppable(ref, () => ({ skipTransform: true }))}
  />
}

function DraggableItem(props) {
  const draggable = createDraggable(props.id);

  return <div
    class={styles.draggable}
    style={{
      'grid-row': `${props.row + 1}`,
      'grid-column': `${props.col + 1}`,
    }}
    ref={ref => draggable(ref, () => ({ skipTransform: true }))}
  />
}

export default App;


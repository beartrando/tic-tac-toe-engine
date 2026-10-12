import BattleCellValueEnum from "../enums/battle-cell-value.enum";

export class BattleBoard {
    readonly cells: readonly BattleCellValueEnum[];

    constructor(cells: readonly BattleCellValueEnum[]) {
        // no cells received -> the battle is fresh, the board is empty
        if (cells.length === 0) {
            this.cells = Array(9).fill(BattleCellValueEnum.EMPTY);
            return;
        }

        if (cells.length !== 9) {
            throw new Error("BattleBoard must contain 9 cells");
        }

        if (
            cells.some(
                cell => !Object.values(BattleCellValueEnum).includes(cell),
            )
        ) {
            throw new Error("Invalid cell value");
        }

        this.cells = [...cells];
    }

    static empty(): BattleBoard {
        return new BattleBoard(
            Array(9).fill(BattleCellValueEnum.EMPTY),
        );
    }

    isEmpty(): boolean {
        return this.cells.every(
            cell => cell === BattleCellValueEnum.EMPTY,
        );
    }

    move(
        cellIndex: number,
        value: BattleCellValueEnum,
    ): BattleBoard {
        if (cellIndex < 0 || cellIndex >= this.cells.length) {
            throw new Error("Invalid cell index");
        }

        if (this.cells[cellIndex] !== BattleCellValueEnum.EMPTY) {
            throw new Error("Cell is not empty");
        }

        const cells = [...this.cells];
        cells[cellIndex] = value;

        return new BattleBoard(cells);
    }
}

export default BattleBoard;

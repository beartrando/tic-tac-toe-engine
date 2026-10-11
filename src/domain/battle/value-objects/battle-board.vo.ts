import BattleCellValueEnum from "../enums/battle-cell-value.enum";

export class BattleBoard {
    readonly cells: readonly BattleCellValueEnum[];

    constructor(cells: readonly BattleCellValueEnum[]) {
        const values = cells.length === 0
            ? Array(9).fill(BattleCellValueEnum.EMPTY)
            : [...cells];

        if (values.length !== 9) {
            throw new Error("BattleBoard must contain 9 cells");
        }

        if (
            values.some(
                cell => !Object.values(BattleCellValueEnum).includes(cell),
            )
        ) {
            throw new Error("Invalid cell value");
        }

        this.cells = values;
    }

    static empty(): BattleBoard {
        return new BattleBoard([]);
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

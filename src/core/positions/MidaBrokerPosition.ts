import { MidaBrokerOrder } from "#orders/MidaBrokerOrder";
import { MidaBrokerPositionParameters } from "#positions/MidaBrokerPositionParameters";

export abstract class MidaBrokerPosition {
    readonly #id: string;
    readonly #symbol: string;
    #volume: number;
    #entryPrice: number;

    protected constructor ({
        id,
        symbol,
        volume,
    }: MidaBrokerPositionParameters) {
        this.#id = id;
        this.#symbol = symbol;
        this.#volume = volume;
    }

    public get id (): string {
        return this.#id;
    }

    public get symbol (): string {
        return this.#symbol;
    }

    public get volume (): number {
        return this.#volume;
    }

    public abstract addVolume (quantity: number): Promise<MidaBrokerOrder>;

    public abstract subtractVolume (quantity: number): Promise<MidaBrokerOrder>;

    public abstract close (volume?: number): Promise<MidaBrokerOrder>;

    public abstract setStopLoss (stopLoss: number): Promise<void>;

    public abstract setTrailingStopLoss (enabled: boolean): Promise<void>;

    public abstract setTakeProfit (takeProfit: number): Promise<void>;
}

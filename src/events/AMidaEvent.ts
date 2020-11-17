// Represents an event.
export abstract class AMidaEvent {
    // Represents the event type.
    private readonly _type: string;

    // Represents the event time.
    private readonly _time: Date;

    // Represents the event details.
    private readonly _details: any;

    protected constructor (type: string, time: Date, details: any = {}) {
        this._type = type;
        this._time = new Date(time);
        this._details = { ...details, };
    }

    public get type (): string {
        return this._type;
    }

    public get time (): Date {
        return new Date(this._time);
    }

    public get details (): any {
        return { ...this._details, };
    }
}
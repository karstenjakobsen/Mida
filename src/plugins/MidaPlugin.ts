import { MidaPluginParameters } from "#plugins/MidaPluginParameters";
import { GenericObject } from "#utilities/GenericObject";

export abstract class MidaPlugin {
    private readonly _name: string;
    private readonly _description: string;
    private readonly _version: string;

    protected constructor ({ name, description = "", version, }: MidaPluginParameters) {
        this._name = name;
        this._description = description;
        this._version = version;
    }

    public get name (): string {
        return this._name;
    }

    public get description (): string {
        return this._description;
    }

    public get version (): string {
        return this._version;
    }

    public abstract install (options?: GenericObject): void;
}
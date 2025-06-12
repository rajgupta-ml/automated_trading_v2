import UpstoxManager from '../brokerManager/upstoxManager';

export type ManagerConstructors = {
    upstox: typeof UpstoxManager;
};

export class IntegrationFactory {
    private readonly Managers: ManagerConstructors = {
        upstox: UpstoxManager,
    };

    public getManager<T extends keyof ManagerConstructors>(
        managerName: T,
    ): InstanceType<ManagerConstructors[T]> {
        const ManagerClass = this.Managers[managerName];

        if (!ManagerClass) {
            throw new Error(
                `Manager "${String(managerName)}" not found. Available managers: ${Object.keys(this.Managers).join(', ')}`,
            );
        }
        return new ManagerClass() as InstanceType<ManagerConstructors[T]>;
    }
}

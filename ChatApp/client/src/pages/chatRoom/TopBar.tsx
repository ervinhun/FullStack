type Props = {
    roomName: string;
    dmCount: number;
    onLeave: () => void;
};

export function TopBar({ roomName, dmCount, onLeave }: Props) {
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-base-200 border-b">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">{roomName}</h1>

                <div className="indicator">
          <span className="indicator-item badge badge-secondary">
            {dmCount}
          </span>
                    <button className="btn btn-sm btn-ghost">DMs</button>
                </div>
            </div>

            <button className="btn btn-sm btn-error" onClick={onLeave}>
                Leave room
            </button>
        </div>
    );
}

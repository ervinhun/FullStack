type Props = {
    users: string[];
    onPoke: (user: string) => void;
};

export function UserSidebar({ users, onPoke }: Props) {
    return (
        <div className="w-56 flex-shrink-0 border-l bg-base-100 p-3 flex flex-col overflow-hidden">
            <h2 className="font-semibold mb-2">
                Active users ({users.length})
            </h2>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {users.map(user => (
                    <div
                        key={user}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-base-200"
                    >
                        <span>{user}</span>
                        <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => onPoke(user)}
                            title="Poke"
                        >
                            👉
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

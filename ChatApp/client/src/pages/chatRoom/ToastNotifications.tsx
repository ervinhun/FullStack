type Props = {
    message?: string;
};

export function ToastNotifications({ message }: Props) {
    if (!message) return null;

    return (
        <div className="toast toast-bottom toast-center">
            <div className="alert alert-info">
                <span>{message}</span>
            </div>
        </div>
    );
}

type Props = {
    shaking: boolean;
    children: React.ReactNode;
};

export function ShakeContainer({ shaking, children }: Props) {
    return (
        <div id="root" className={shaking ? 'shake' : ''}>
            {children}
        </div>
    );
}

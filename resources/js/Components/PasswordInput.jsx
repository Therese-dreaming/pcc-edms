import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { IconEye, IconEyeOff, IconLock } from '@tabler/icons-react';

export default forwardRef(function PasswordInput(
    { className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <div className="relative">
            <IconLock
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                aria-hidden="true"
            />

            <input
                {...props}
                type={visible ? 'text' : 'password'}
                ref={localRef}
                className={
                    'w-full rounded-md border-zinc-300 pl-10 pr-10 focus:border-primary-500 focus:ring-primary-500 ' +
                    className
                }
            />

            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                title={visible ? 'Hide password' : 'Show password'}
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? (
                    <IconEyeOff size={18} aria-hidden="true" />
                ) : (
                    <IconEye size={18} aria-hidden="true" />
                )}
            </button>
        </div>
    );
});

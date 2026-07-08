import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, icon: Icon, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const input = (
        <input
            {...props}
            type={type}
            className={
                `rounded-md border-zinc-300 focus:border-primary-500 focus:ring-primary-500 ${Icon ? 'pl-10' : ''} ` +
                className
            }
            ref={localRef}
        />
    );

    if (!Icon) {
        return input;
    }

    return (
        <div className="relative">
            <Icon
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                aria-hidden="true"
            />
            {input}
        </div>
    );
});

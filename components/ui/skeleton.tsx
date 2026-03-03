import React from "react"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700/50 ${className || ""}`}
            {...props}
        />
    )
}

export { Skeleton }

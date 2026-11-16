import React, { useEffect, useRef } from "react";
import * as FaIcons from 'react-icons/fa6';
import { Button, type ButtonVariant, type ButtonSize } from "./index";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";

interface ModalAction {
    label: string;
    onClick: () => void | Promise<void>;
    isLoading?: boolean;
    loadingText?: string;
    variant?: ButtonVariant;
    iconName?: keyof typeof FaIcons;
    size?: ButtonSize;
    className?: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    primaryAction?: ModalAction;
    secondaryAction?: ModalAction;
    footer?: React.ReactNode;
    centerFooter?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "custom";
    customSize?: string;
    hideHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    primaryAction,
    secondaryAction,
    footer,
    centerFooter = false,
    size = "md",
    customSize,
    hideHeader = false,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Prevent Closing When Submitting
    useOnClickOutside(modalRef, () => {
        if (!primaryAction?.isLoading) onClose();
    });

    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !primaryAction?.isLoading) {
            onClose();
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, primaryAction?.isLoading]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">

            {/* Overlay */}
            <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-sm" />

            {/* Modal */}
            <div
                ref={modalRef}
                className={`relative w-full ${size !== "custom" ? sizeClasses[size] : ""} 
                bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden transition-colors duration-300`}
                style={size === "custom" && customSize ? { maxWidth: customSize } : undefined}>
                
                {/* Tech Glows */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none hidden dark:block" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-650/5 rounded-full blur-[80px] pointer-events-none hidden dark:block" />

                {/* Header */}
                {!hideHeader && (
                    <div className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 transition-colors duration-300">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white transition-colors">
                            {title}
                        </h2>

                        <Button
                            variant="ghost"
                            size="sm"
                            tooltip="Close"
                            tooltipPosition="left"
                            iconName="FaXmark"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:bg-slate-100 dark:hover:bg-white/5 shadow-none transition-colors"
                            disabled={primaryAction?.isLoading}>
                        </Button>
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 p-8 max-h-[70vh] overflow-y-auto flex-1 text-slate-700 dark:text-slate-350 transition-colors duration-300">
                    {children}
                </div>

                {/* Footer */}
                {(footer || primaryAction || secondaryAction) && (
                    <div className={`relative z-10 px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/40 flex items-center gap-3 transition-colors duration-300 ${centerFooter ? 'justify-center' : 'justify-end'}`}>
                        {footer ? (
                            footer
                        ) : (
                            <>
                                {secondaryAction && (
                                    <Button
                                        variant={secondaryAction.variant || "secondary"}
                                        onClick={secondaryAction.onClick}
                                        size={secondaryAction.size || "md"}
                                        disabled={primaryAction?.isLoading}
                                        className={secondaryAction.className}
                                    >
                                        {secondaryAction.label}
                                    </Button>
                                )}

                                {primaryAction && (
                                    <Button
                                        variant={primaryAction.variant || "primary"}
                                        onClick={primaryAction.onClick}
                                        isLoading={primaryAction.isLoading}
                                        loadingText={primaryAction.loadingText}
                                        iconName={primaryAction.iconName}
                                        size={primaryAction.size || "md"}
                                        className={primaryAction.className}
                                    >
                                        {primaryAction.label}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
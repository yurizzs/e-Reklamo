import React, { useEffect, useRef } from "react";
import * as FaIcons from 'react-icons/fa6';
import { Button, type ButtonVariant } from "./index";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";

interface ModalAction {
    label: string;
    onClick: () => void | Promise<void>;
    isLoading?: boolean;
    loadingText?: string;
    variant?: ButtonVariant;
    iconName?: keyof typeof FaIcons;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    primaryAction?: ModalAction;
    secondaryAction?: ModalAction;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "custom";
    customSize?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    primaryAction,
    secondaryAction,
    footer,
    size = "md",
    customSize,
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
            <div className="fixed inset-0 bg-[#080B14]/80 backdrop-blur-sm" />

            {/* Modal */}
            <div
                ref={modalRef}
                className={`relative w-full ${size !== "custom" ? sizeClasses[size] : ""} 
                bg-[#0B0F1A] border border-white/10 shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden`}
                style={size === "custom" && customSize ? { maxWidth: customSize } : undefined}>
                
                {/* Tech Glows */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600/5 rounded-full blur-[80px] pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/20">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                        {title}
                    </h2>

                    <Button
                        variant="ghost"
                        size="sm"
                        tooltip="Close"
                        tooltipPosition="left"
                        iconName="FaXmark"
                        onClick={onClose}
                        className="text-slate-500 hover:text-white border-transparent hover:bg-white/5 shadow-none"
                        disabled={primaryAction?.isLoading}>
                    </Button>
                </div>

                {/* Content */}
                <div className="relative z-10 p-8 max-h-[70vh] overflow-y-auto flex-1 text-slate-300">
                    {children}
                </div>

                {/* Footer */}
                {(footer || primaryAction || secondaryAction) && (
                    <div className="relative z-10 px-8 py-6 border-t border-white/5 bg-black/40 flex justify-end items-center gap-4">
                        {footer ? (
                            footer
                        ) : (
                            <>
                                {secondaryAction && (
                                    <Button
                                        variant={secondaryAction.variant || "ghost"}
                                        onClick={secondaryAction.onClick}
                                        size="md"
                                        className="text-slate-400 hover:text-white border-transparent"
                                        disabled={primaryAction?.isLoading}
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
                                        size="md"
                                        className="bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
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
import React from "react";
import styled, { css } from "styled-components";
import { theme } from "../../styles/theme";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case "primary":
      return css`
        background-color: ${theme.colors.primary};
        color: white;
        border: 1px solid ${theme.colors.primary};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primaryHover};
          border-color: ${theme.colors.primaryHover};
        }
      `;
    case "secondary":
      return css`
        background-color: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.text};
        border: 1px solid ${theme.colors.border};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.border};
        }
      `;
    case "outline":
      return css`
        background-color: transparent;
        color: ${theme.colors.primary};
        border: 1px solid ${theme.colors.primary};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primary};
          color: white;
        }
      `;
    case "ghost":
      return css`
        background-color: transparent;
        color: ${theme.colors.text};
        border: 1px solid transparent;

        &:hover:not(:disabled) {
          background-color: ${theme.colors.backgroundSecondary};
        }
      `;
    default:
      return getVariantStyles("primary");
  }
};

const getSizeStyles = (size: string) => {
  switch (size) {
    case "sm":
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        font-size: ${theme.fontSize.sm};
      `;
    case "md":
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        font-size: ${theme.fontSize.base};
      `;
    case "lg":
      return css`
        padding: ${theme.spacing.lg} ${theme.spacing.xl};
        font-size: ${theme.fontSize.lg};
      `;
    default:
      return getSizeStyles("md");
  }
};

const StyledButton = styled.button<{ variant: string; size: string }>`
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: all ${theme.transitions.medium};
  border: none;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};

  ${(props) => getVariantStyles(props.variant)}
  ${(props) => getSizeStyles(props.size)}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.borderFocus};
    outline-offset: 2px;
  }
`;

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  children,
  onClick,
  type = "button",
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && <span>Loading...</span>}
      {children}
    </StyledButton>
  );
};

export default Button;

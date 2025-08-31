import React from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";

interface InputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  name?: string;
  required?: boolean;
}

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const Label = styled.label`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
`;

const StyledInput = styled.input<{ hasError: boolean }>`
  padding: ${theme.spacing.md};
  border: 2px solid
    ${(props) => (props.hasError ? theme.colors.error : theme.colors.border)};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.base};
  transition: all ${theme.transitions.medium};
  background-color: ${theme.colors.background};
  color: ${theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${(props) =>
      props.hasError ? theme.colors.error : theme.colors.borderFocus};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.hasError
          ? `${theme.colors.error}20`
          : `${theme.colors.borderFocus}20`};
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: ${theme.colors.textSecondary};
  }
`;

const ErrorText = styled.span`
  color: ${theme.colors.error};
  font-size: ${theme.fontSize.xs};
  margin-top: ${theme.spacing.xs};
`;

const Input: React.FC<InputProps> = ({ label, error, id, ...inputProps }) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <InputContainer>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <StyledInput id={inputId} hasError={!!error} {...inputProps} />
      {error && <ErrorText>{error}</ErrorText>}
    </InputContainer>
  );
};

export default Input;

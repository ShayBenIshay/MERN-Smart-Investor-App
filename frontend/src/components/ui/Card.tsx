import React from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";

interface CardProps {
  children: React.ReactNode;
  padding?: keyof typeof theme.spacing;
  shadow?: keyof typeof theme.shadows;
  className?: string;
}

const StyledCard = styled.div<{ padding: string; shadow: string }>`
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  padding: ${(props) =>
    theme.spacing[props.padding as keyof typeof theme.spacing]};
  box-shadow: ${(props) =>
    theme.shadows[props.shadow as keyof typeof theme.shadows]};
  transition: box-shadow ${theme.transitions.medium};

  &:hover {
    box-shadow: ${theme.shadows.md};
  }
`;

const Card: React.FC<CardProps> = ({
  children,
  padding = "lg",
  shadow = "sm",
  className,
  ...props
}) => {
  return (
    <StyledCard
      padding={padding}
      shadow={shadow}
      className={className}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

export default Card;

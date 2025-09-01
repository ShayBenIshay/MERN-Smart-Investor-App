import React from "react";
import styled from "styled-components";

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const PageButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  background: ${(props) => (props.active ? "#3b82f6" : "white")};
  color: ${(props) => (props.active ? "white" : "#374151")};
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => (props.active ? "#2563eb" : "#f9fafb")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <PaginationContainer>
      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage}
      >
        Previous
      </PageButton>

      <PageInfo>
        {startItem}-{endItem} of {totalItems}
      </PageInfo>

      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      >
        Next
      </PageButton>
    </PaginationContainer>
  );
};

export default Pagination;

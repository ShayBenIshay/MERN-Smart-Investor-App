import React from "react";
import styled from "styled-components";

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px solid #dbeafe;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ClearButton = styled.button`
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    background: #dc2626;
  }
`;

const TransactionFilters = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <FilterContainer>
      <FilterGroup>
        <Label>Ticker</Label>
        <Input
          type="text"
          placeholder="e.g., AAPL"
          value={filters.ticker || ""}
          onChange={(e) => onFilterChange("ticker", e.target.value)}
        />
      </FilterGroup>

      <FilterGroup>
        <Label>Operation</Label>
        <Select
          value={filters.operation || ""}
          onChange={(e) => onFilterChange("operation", e.target.value)}
        >
          <option value="">All</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </Select>
      </FilterGroup>

      <FilterGroup>
        <Label>Start Date</Label>
        <Input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => onFilterChange("startDate", e.target.value)}
        />
      </FilterGroup>

      <FilterGroup>
        <Label>End Date</Label>
        <Input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => onFilterChange("endDate", e.target.value)}
        />
      </FilterGroup>

      <FilterGroup>
        <Label>Sort By</Label>
        <Select
          value={filters.sortBy || "executedAt"}
          onChange={(e) => onFilterChange("sortBy", e.target.value)}
        >
          <option value="executedAt">Date</option>
          <option value="ticker">Ticker</option>
          <option value="price">Price</option>
          <option value="papers">Shares</option>
        </Select>
      </FilterGroup>

      <FilterGroup>
        <Label>Order</Label>
        <Select
          value={filters.sortOrder || "desc"}
          onChange={(e) => onFilterChange("sortOrder", e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </Select>
      </FilterGroup>

      <ClearButton onClick={onClearFilters}>Clear Filters</ClearButton>
    </FilterContainer>
  );
};

export default TransactionFilters;
